/**
 * ガチャ抽選結果1件分の DTO
 */
export interface GachaItem {
  item_id: number;
  name: string;
  icon: string | null;
  rare: string;
  rank: number;
  is_present: boolean;
  reroll: number;
}

/**
 * おみくじ
 */
export interface Omikuji {
  luck: string;
  description: string;
}

/**
 * 通常ガチャのリクエスト
 */
export interface GachaPickRequest {
  guildId: string;
  userId: string;
  userName: string;
  /** 引く回数 (limit 指定時は無視) */
  count?: number;
  /** 残り回数すべて引く */
  limit?: boolean;
  /** 7日以内の通話参加履歴を要求する (.gacha コマンド互換) */
  requireVoiceActivity?: boolean;
}

/**
 * 通常ガチャの結果
 */
export interface GachaPickResult {
  /** 引いた順のアイテムリスト */
  list: GachaItem[];
  /** チケットによる増加回数 */
  ticketRolls: number;
  /** チケット増加の総数 (limit 時は連鎖分を含む) */
  totalRolls: number;
  /** 残りガチャ回数 */
  pickLeft: number;
  /** 当選したプレゼント */
  presents: GachaItem[];
}

/**
 * 通常ガチャのエラー
 */
export type GachaPickError =
  | { type: 'NO_VOICE_HISTORY' }
  | { type: 'VOICE_HISTORY_EXPIRED' }
  | { type: 'INSUFFICIENT_PICKS'; pickLeft: number };

/**
 * 拡張ガチャ (景品無効シミュレーション) のオプション
 */
export type GachaSimulateOptions =
  | { mode: 'count'; count: number }
  | {
      mode: 'target';
      target: string;
      /** 等級以外の単語をアイテム名の部分一致として扱う (.gacha extra コマンド互換) */
      matchByName: boolean;
    };

/**
 * 拡張ガチャの結果
 */
export type GachaSimulateResult =
  | { list: GachaItem[] }
  | { error: 'LIMIT_EXCEEDED'; attempts: number };

/**
 * プレゼント一覧情報
 */
export interface GachaPresentInfo {
  userName: string | null;
  pickLeft: number;
  presents: {
    id: number;
    name: string;
    rare: string;
    icon: string | null;
    price: number;
  }[];
  totalPrice: number;
}

/**
 * プレゼント使用・付与の結果
 */
export interface PresentTransaction {
  userId: string;
  itemName: string;
}
