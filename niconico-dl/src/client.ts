import type { Readable } from "node:stream";
import { CookieJar } from "./cookies.js";
import { LoginRequiredError, NiconicoError } from "./errors.js";
import { spawnFfmpegStream, streamToFile } from "./ffmpeg.js";
import {
  extractVideoId,
  fetchHls,
  fetchVideoInfo,
} from "./watch.js";
import type {
  ClientOptions,
  FormatInfo,
  QualitySelector,
  StreamOptions,
  VideoInfo,
} from "./types.js";

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const LOGIN_BASE = "https://account.nicovideo.jp";
const WATCH_REFERER = "https://www.nicovideo.jp/";

/** ストリーム取得結果。 */
export interface VideoStream {
  /** 多重化済みの動画データ（mp4 等）。 */
  stream: Readable;
  /** ffmpeg プロセスの終了を待つ Promise。 */
  done: Promise<void>;
  /** 取得に用いたフォーマット。 */
  format: FormatInfo;
  /** 明示的に中断する。 */
  kill: () => void;
}

/**
 * ニコニコ動画クライアント。
 *
 * @example
 * const nico = new NiconicoClient({ userSession: process.env.NICO_SESSION });
 * const info = await nico.getInfo("sm9");
 * const { stream } = await nico.getStream("sm9");
 * stream.pipe(fs.createWriteStream("out.mp4"));
 */
export class NiconicoClient {
  private readonly jar = new CookieJar();
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClientOptions = {}) {
    this.userAgent = options.userAgent ?? DEFAULT_UA;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new NiconicoError(
        "fetch が利用できません。Node 18 以上を使うか options.fetch を指定してください",
      );
    }
    if (options.cookie) this.jar.setFromHeaderString(options.cookie);
    if (options.userSession) {
      this.jar.set({ name: "user_session", value: options.userSession });
    }
  }

  /** user_session の有無でログイン状態を判定。 */
  get isLoggedIn(): boolean {
    return this.jar.has("user_session");
  }

  private deps() {
    return { jar: this.jar, userAgent: this.userAgent, fetchImpl: this.fetchImpl };
  }

  /**
   * メール/パスワードでログインし、セッション Cookie を取得する。
   * 二段階認証が有効なアカウントは未対応（事前に userSession を渡す方式を推奨）。
   */
  async login(mailTel: string, password: string): Promise<void> {
    if (this.isLoggedIn) return;

    // セッション Cookie を確立。
    const pre = await this.fetchImpl(`${LOGIN_BASE}/login`, {
      headers: { "User-Agent": this.userAgent, Cookie: this.jar.toHeader() },
    });
    this.jar.setFromResponse(pre);

    const res = await this.fetchImpl(`${LOGIN_BASE}/login/redirector`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: `${LOGIN_BASE}/login`,
        "User-Agent": this.userAgent,
        Cookie: this.jar.toHeader(),
      },
      body: new URLSearchParams({ mail_tel: mailTel, password }).toString(),
    });
    this.jar.setFromResponse(res);

    if (!this.isLoggedIn) {
      throw new LoginRequiredError(
        "ログインに失敗しました（認証情報が誤っているか、二段階認証が有効です）",
      );
    }
  }

  /** 取得済みのセッション Cookie をエクスポート（再利用・保存用）。 */
  exportCookies(): string {
    return this.jar.toHeader();
  }

  /** 動画メタデータと利用可能フォーマットを取得。 */
  async getInfo(urlOrId: string): Promise<VideoInfo> {
    const videoId = extractVideoId(urlOrId);
    return fetchVideoInfo(videoId, this.deps());
  }

  /**
   * 動画ストリームを取得する。内部で access-rights/hls → ffmpeg を実行。
   * @param urlOrId watch URL または ID
   */
  async getStream(
    urlOrId: string,
    options: StreamOptions = {},
  ): Promise<VideoStream> {
    const videoId = extractVideoId(urlOrId);
    const info = await fetchVideoInfo(videoId, this.deps());
    return this.getStreamFromInfo(info, options);
  }

  /** 取得済みの VideoInfo からストリームを取得（メタデータ再取得を省略）。 */
  async getStreamFromInfo(
    info: VideoInfo,
    options: StreamOptions = {},
  ): Promise<VideoStream> {
    if (info.formats.length === 0) {
      throw new NiconicoError(
        "再生可能なフォーマットがありません（会員限定・PPV の可能性。ログインを確認してください）",
      );
    }

    const format = selectFormat(info.formats, options.quality ?? "best");
    const hls = await fetchHls(
      info.id,
      info.raw,
      [[format.videoId, format.audioId]],
      this.deps(),
    );

    const { stream, done, kill } = spawnFfmpegStream(
      {
        m3u8Url: hls.contentUrl,
        cookieHeader: hls.cookieHeader,
        userAgent: this.userAgent,
        referer: WATCH_REFERER,
      },
      options,
    );

    return { stream, done, format, kill };
  }

  /** 動画を指定パスへダウンロード保存する。 */
  async download(
    urlOrId: string,
    destPath: string,
    options: StreamOptions = {},
  ): Promise<{ format: FormatInfo; info: VideoInfo }> {
    const videoId = extractVideoId(urlOrId);
    const info = await fetchVideoInfo(videoId, this.deps());
    const result = await this.getStreamFromInfo(info, options);
    await streamToFile(
      { stream: result.stream, done: result.done, kill: result.kill },
      destPath,
    );
    return { format: result.format, info };
  }
}

function selectFormat(
  formats: FormatInfo[],
  selector: QualitySelector,
): FormatInfo {
  if (typeof selector === "function") return selector(formats);
  // formats は totalBitRate 昇順。
  if (selector === "worst") return formats[0]!;
  return formats[formats.length - 1]!; // best
}
