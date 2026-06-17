/** ニコニコ watch API (v3 / v3_guest) のレスポンスのうち、本モジュールが利用する部分。 */

export interface DomandSource {
  id: string;
  isAvailable: boolean;
  label?: string;
  bitRate?: number;
  width?: number;
  height?: number;
  qualityLevel?: number;
  samplingRate?: number;
}

export interface WatchApiData {
  client?: {
    watchId?: string;
    watchTrackId?: string;
  };
  media?: {
    domand?: {
      videos?: DomandSource[];
      audios?: DomandSource[];
      accessRightKey?: string;
    };
  };
  video?: {
    id?: string;
    title?: string;
    description?: string;
    duration?: number;
    registeredAt?: string;
    count?: {
      view?: number;
      comment?: number;
      like?: number;
    };
    thumbnail?: Record<string, string>;
  };
  owner?: { id?: number | string; nickname?: string };
  channel?: { id?: string; name?: string };
  tag?: { items?: Array<{ name?: string }> };
  genre?: { label?: string };
  reasonCode?: string;
  publishScheduledAt?: string;
}

export interface WatchApiResponse {
  meta?: { status?: number; errorCode?: string };
  data?: WatchApiData;
}

/** 整形済みの動画メタデータ。 */
export interface VideoInfo {
  id: string;
  title: string;
  description: string | null;
  durationSec: number | null;
  registeredAt: string | null;
  viewCount: number | null;
  commentCount: number | null;
  likeCount: number | null;
  tags: string[];
  genre: string | null;
  uploaderName: string | null;
  uploaderId: string | null;
  thumbnails: { id: string; url: string }[];
  /** ffmpeg に渡すストリーム取得に必要な内部情報。 */
  formats: FormatInfo[];
  /** ストリーム取得で利用する生の watch データ。 */
  raw: WatchApiData;
}

/** 選択可能な映像/音声フォーマット。 */
export interface FormatInfo {
  videoId: string;
  audioId: string;
  width?: number;
  height?: number;
  videoBitRate?: number;
  audioBitRate?: number;
  /** 概算の総ビットレート（bps）。品質ソート用。 */
  totalBitRate: number;
  label: string;
}

export type QualitySelector =
  | "best"
  | "worst"
  | ((formats: FormatInfo[]) => FormatInfo);

export interface ClientOptions {
  /** 既存セッションの user_session Cookie。指定するとログイン済み扱い。 */
  userSession?: string;
  /** "a=b; c=d" 形式の Cookie ヘッダ文字列をまとめて投入。 */
  cookie?: string;
  /** User-Agent を上書き。 */
  userAgent?: string;
  /** fetch 実装の差し替え（テスト用）。 */
  fetch?: typeof fetch;
}

export interface StreamOptions {
  /** 取得する品質。既定は "best"。 */
  quality?: QualitySelector;
  /**
   * 出力コンテナ。
   * - "mp4": フラグメント mp4（パイプ向け、既定）
   * - "matroska": mkv
   * - "mpegts": ts
   */
  container?: "mp4" | "matroska" | "mpegts";
  /** ffmpeg 実行ファイルのパス。未指定なら ffmpeg-static → PATH の順で解決。 */
  ffmpegPath?: string;
  /** ffmpeg に追加で渡す引数。 */
  extraArgs?: string[];
  /** AbortSignal で中断可能。 */
  signal?: AbortSignal;
}
