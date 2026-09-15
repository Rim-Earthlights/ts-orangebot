import { CONFIG } from './config.js';

/**
 * 音声合成エンジンの接続先.
 *
 * `config.ts` は gitignore されており、既存の環境には `API` キーが無い。
 * その場合は従来ソースに決め打ちしていた値へフォールバックする。
 */
const DEFAULT_VOICEVOX_URI = 'http://127.0.0.1:50021';
const DEFAULT_COEIROINK_URI = 'http://127.0.0.1:50022';

const api = (CONFIG as { API?: { VOICEVOX?: string; COEIROINK?: string } }).API ?? {};

/** `${URI}/path` で連結するため末尾のスラッシュを取り除く */
const normalize = (uri: string): string => uri.replace(/\/+$/, '');

export const VOICEVOX_URI = normalize(api.VOICEVOX ?? DEFAULT_VOICEVOX_URI);
export const COEIROINK_URI = normalize(api.COEIROINK ?? DEFAULT_COEIROINK_URI);
