import { Innertube, Log, Platform, UniversalCache } from 'youtubei.js';
import { CONFIG } from '../../config/config.js';

// ストリーミングURLの署名解読に必要なJS評価器を設定する
// https://ytjs.dev/guide/getting-started.html#providing-a-custom-javascript-interpreter
Platform.shim.eval = (data) => {
  return new Function(data.output)();
};

// 未知ノードのパーサ警告がコンソールを埋めるため抑制する
Log.setLevel(Log.Level.ERROR);

let innertube: Innertube | undefined;

// ログイン済みCookieによる認証 (config.ts の YOUTUBE.COOKIE に設定)
// https://ytjs.dev/guide/authentication.html
// config.ts 側に COOKIE が未定義でもコンパイルできるよう optional として扱う
const YOUTUBE_COOKIE = (CONFIG.YOUTUBE as { COOKIE?: string }).COOKIE;

/**
 * Innertubeクライアントを取得する(初回呼び出し時のみ生成)
 * @returns
 */
export async function getInnertube(): Promise<Innertube> {
  if (!innertube) {
    innertube = await Innertube.create({
      cache: new UniversalCache(true),
      cookie: YOUTUBE_COOKIE || undefined,
    });
  }
  return innertube;
}

const VIDEO_ID_REGEX = /^[\w-]{11}$/;

/**
 * Youtubeの動画URLから動画IDを抽出する
 * @param url 動画url
 * @returns 動画ID / 動画URLでない場合はnull
 */
export function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);

    if (u.hostname === 'youtu.be') {
      const id = u.pathname.split('/')[1];
      return VIDEO_ID_REGEX.test(id) ? id : null;
    }

    if (!/(^|\.)youtube\.com$/.test(u.hostname)) {
      return null;
    }

    const v = u.searchParams.get('v');
    if (v && VIDEO_ID_REGEX.test(v)) {
      return v;
    }

    const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const PLAYLIST_ID_REGEX = /^(?:PL|UU|LL|RD|OL)[\w-]{10,}$/;

/**
 * YoutubeのURLからプレイリストIDを抽出する
 * @param url プレイリストurl or プレイリストID
 * @returns プレイリストID / 見つからない場合はnull
 */
export function extractPlaylistId(url: string): string | null {
  try {
    const u = new URL(url);

    if (u.hostname !== 'youtu.be' && !/(^|\.)youtube\.com$/.test(u.hostname)) {
      return null;
    }

    const list = u.searchParams.get('list');
    return list && /^[\w-]+$/.test(list) ? list : null;
  } catch {
    return PLAYLIST_ID_REGEX.test(url) ? url : null;
  }
}
