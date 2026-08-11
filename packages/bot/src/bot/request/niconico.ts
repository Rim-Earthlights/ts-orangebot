import { NiconicoClient, type FormatInfo, type StreamOptions, type VideoStream } from 'niconico-dl';

// ニコニコの ffmpeg は bot 起動時と同じパスに揃える (FFMPEG_PATH 環境変数 / 既定 /usr/bin/ffmpeg)
const FFMPEG_PATH = process.env.FFMPEG_PATH;

let client: NiconicoClient | undefined;

/**
 * NiconicoClient を取得する (初回呼び出し時のみ生成)
 * 公開動画のみを対象とするためログインは行わない
 * @returns
 */
export function getNiconicoClient(): NiconicoClient {
  if (!client) {
    client = new NiconicoClient();
  }
  return client;
}

/**
 * 入力がニコニコ動画の URL または ID かどうかを判定する
 * @param input URL or 動画ID (sm9 / so12345 / nm12345)
 * @returns
 */
export function isNiconicoUrl(input: string): boolean {
  try {
    const u = new URL(input);
    if (/(^|\.)nicovideo\.jp$/.test(u.hostname) && u.pathname.startsWith('/watch/')) {
      return true;
    }
    return u.hostname === 'nico.ms';
  } catch {
    return /^(?:[a-z]{2})?\d+$/i.test(input.trim());
  }
}

/**
 * 音楽 bot 向けのフォーマット選択
 * 映像は ffmpeg 側で破棄するため、音声ビットレート最優先・映像ビットレート最小で選ぶ
 */
function pickAudioFormat(formats: FormatInfo[]): FormatInfo {
  return [...formats].sort(
    (a, b) => (b.audioBitRate ?? 0) - (a.audioBitRate ?? 0) || (a.videoBitRate ?? 0) - (b.videoBitRate ?? 0)
  )[0];
}

/**
 * ニコニコ動画のメタデータを取得する
 * @param urlOrId watch URL または ID
 * @returns
 */
export async function getNiconicoInfo(urlOrId: string) {
  return await getNiconicoClient().getInfo(urlOrId);
}

/**
 * ニコニコ動画の音声ストリームを取得する
 * 映像は破棄 (-vn) して帯域・CPU を節約する
 * @param urlOrId watch URL または ID
 * @param extraArgs ffmpeg への追加引数 (seek 用の -ss など)
 * @returns
 */
export async function getNiconicoStream(urlOrId: string, extraArgs: string[] = []): Promise<VideoStream> {
  const options: StreamOptions = {
    quality: pickAudioFormat,
    extraArgs: ['-vn', ...extraArgs],
  };
  if (FFMPEG_PATH) {
    options.ffmpegPath = FFMPEG_PATH;
  }
  return await getNiconicoClient().getStream(urlOrId, options);
}
