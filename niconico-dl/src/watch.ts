import { CookieJar } from "./cookies.js";
import {
  LoginRequiredError,
  NiconicoError,
  VideoUnavailableError,
} from "./errors.js";
import type {
  DomandSource,
  FormatInfo,
  VideoInfo,
  WatchApiData,
  WatchApiResponse,
} from "./types.js";

const API_BASE = "https://nvapi.nicovideo.jp";
const BASE_URL = "https://www.nicovideo.jp";

const FRONTEND_HEADERS = {
  "X-Frontend-ID": "6",
  "X-Frontend-Version": "0",
} as const;

// FORBIDDEN / NOT_FOUND など、ログインで解決し得る理由コード。
const LOGIN_REASON_CODES = new Set([
  "CHANNEL_MEMBER_ONLY",
  "HARMFUL_VIDEO",
  "HIDDEN_VIDEO",
  "PPV_VIDEO",
  "PREMIUM_ONLY",
]);

/** URL もしくは ID 文字列から watch ID（例: sm9, so12345, 12345）を抽出。 */
export function extractVideoId(input: string): string {
  const m = input.match(/(?:nicovideo\.jp\/watch\/|nico\.ms\/)?((?:[a-z]{2})?\d+)/i);
  if (!m?.[1]) throw new NiconicoError(`動画 ID を解釈できません: ${input}`);
  return m[1];
}

function genActionTrackId(): string {
  // yt-dlp と同じ形式: 固定プレフィックス + ミリ秒タイムスタンプ。
  return `AAAAAAAAAA_${Date.now()}`;
}

interface FetchDeps {
  jar: CookieJar;
  userAgent: string;
  fetchImpl: typeof fetch;
}

/** watch API を叩き、整形済みメタデータを返す。 */
export async function fetchVideoInfo(
  videoId: string,
  deps: FetchDeps,
): Promise<VideoInfo> {
  const loggedIn = deps.jar.has("user_session");
  const path = loggedIn ? "v3" : "v3_guest";
  const url = `${BASE_URL}/api/watch/${path}/${videoId}?actionTrackId=${encodeURIComponent(
    genActionTrackId(),
  )}`;

  const res = await deps.fetchImpl(url, {
    headers: {
      ...FRONTEND_HEADERS,
      "User-Agent": deps.userAgent,
      Cookie: deps.jar.toHeader(),
    },
  });
  deps.jar.setFromResponse(res);

  let body: WatchApiResponse;
  try {
    body = (await res.json()) as WatchApiResponse;
  } catch {
    throw new NiconicoError(`watch API のレスポンスを解釈できません (HTTP ${res.status})`);
  }

  const status = body.meta?.status ?? res.status;
  if (status !== 200) {
    throwForError(body);
  }

  const data = body.data;
  if (!data) throw new NiconicoError("watch API に data がありません");

  return buildVideoInfo(videoId, data);
}

function throwForError(body: WatchApiResponse): never {
  const code = body.meta?.errorCode?.toUpperCase();
  const reason = body.data?.reasonCode;

  if (reason === "DOMESTIC_VIDEO" || reason === "HIGH_RISK_COUNTRY_VIDEO") {
    throw new VideoUnavailableError(
      "地域制限により取得できません（日本国内限定）",
      code,
      reason,
    );
  }
  if (reason && LOGIN_REASON_CODES.has(reason)) {
    throw new LoginRequiredError(`ログインが必要です (${reason})`);
  }
  throw new VideoUnavailableError(
    `動画を取得できません (status=${body.meta?.status}, code=${code ?? "不明"}, reason=${reason ?? "不明"})`,
    code,
    reason,
  );
}

function buildFormats(data: WatchApiData): FormatInfo[] {
  const videos = (data.media?.domand?.videos ?? []).filter(
    (v): v is DomandSource => Boolean(v.isAvailable && v.id),
  );
  const audios = (data.media?.domand?.audios ?? []).filter(
    (a): a is DomandSource => Boolean(a.isAvailable && a.id),
  );
  if (videos.length === 0 || audios.length === 0) return [];

  // 各画質の映像に、最高ビットレートの音声を組み合わせる。
  const bestAudio = audios.reduce((a, b) =>
    (b.bitRate ?? 0) > (a.bitRate ?? 0) ? b : a,
  );

  return videos
    .map((v): FormatInfo => {
      const vBr = v.bitRate ?? 0;
      const aBr = bestAudio.bitRate ?? 0;
      return {
        videoId: v.id,
        audioId: bestAudio.id,
        width: v.width,
        height: v.height,
        videoBitRate: v.bitRate,
        audioBitRate: bestAudio.bitRate,
        totalBitRate: vBr + aBr,
        label: v.label ?? (v.height ? `${v.height}p` : v.id),
      };
    })
    .sort((a, b) => a.totalBitRate - b.totalBitRate);
}

function buildVideoInfo(videoId: string, data: WatchApiData): VideoInfo {
  const thumbs = data.video?.thumbnail ?? {};
  const thumbnails = Object.entries(thumbs)
    .filter(([, url]) => typeof url === "string" && url)
    .map(([id, url]) => ({ id, url }));

  const owner = data.owner;
  const channel = data.channel;

  return {
    id: data.video?.id ?? videoId,
    title: data.video?.title ?? "",
    description: data.video?.description ?? null,
    durationSec: data.video?.duration ?? null,
    registeredAt: data.video?.registeredAt ?? null,
    viewCount: data.video?.count?.view ?? null,
    commentCount: data.video?.count?.comment ?? null,
    likeCount: data.video?.count?.like ?? null,
    tags: (data.tag?.items ?? [])
      .map((t) => t.name)
      .filter((n): n is string => Boolean(n)),
    genre: data.genre?.label ?? null,
    uploaderName: channel?.name ?? owner?.nickname ?? null,
    uploaderId:
      channel?.id != null
        ? String(channel.id)
        : owner?.id != null
          ? String(owner.id)
          : null,
    thumbnails,
    formats: buildFormats(data),
    raw: data,
  };
}

export interface HlsResult {
  /** ffmpeg に渡す m3u8 (master playlist) URL。 */
  contentUrl: string;
  /** domand_bid を含む、HLS リクエストに必要な Cookie ヘッダ値。 */
  cookieHeader: string;
}

/**
 * access-rights/hls を叩いて m3u8 URL を取得する。
 * レスポンスで domand_bid Cookie が払い出されるため、これを ffmpeg に渡す。
 */
export async function fetchHls(
  videoId: string,
  data: WatchApiData,
  outputs: Array<[string, string]>,
  deps: FetchDeps,
): Promise<HlsResult> {
  const accessKey = data.media?.domand?.accessRightKey;
  const trackId = data.client?.watchTrackId;
  if (!accessKey || !trackId) {
    throw new NiconicoError(
      "accessRightKey / watchTrackId が取得できません（DRM 動画またはログインが必要）",
    );
  }

  const url = `${API_BASE}/v1/watch/${videoId}/access-rights/hls?actionTrackId=${encodeURIComponent(
    trackId,
  )}`;

  const res = await deps.fetchImpl(url, {
    method: "POST",
    headers: {
      Accept: "application/json;charset=utf-8",
      "Content-Type": "application/json",
      "X-Access-Right-Key": accessKey,
      "X-Request-With": BASE_URL,
      ...FRONTEND_HEADERS,
      "User-Agent": deps.userAgent,
      Cookie: deps.jar.toHeader(),
    },
    body: JSON.stringify({ outputs }),
  });
  deps.jar.setFromResponse(res);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new LoginRequiredError(
        `HLS の取得が拒否されました (HTTP ${res.status})。ログインや視聴権が必要な可能性があります`,
      );
    }
    throw new NiconicoError(`access-rights/hls が失敗しました (HTTP ${res.status})`);
  }

  const json = (await res.json()) as { data?: { contentUrl?: string } };
  const contentUrl = json.data?.contentUrl;
  if (!contentUrl) {
    throw new NiconicoError("contentUrl を取得できませんでした");
  }

  return { contentUrl, cookieHeader: deps.jar.toHeader() };
}
