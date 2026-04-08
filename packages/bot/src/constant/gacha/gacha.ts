/**
 * ガチャ確率
 */
export enum GachaPercents {
  UUR = 0.000102,
  UR = 0.001131,
  SSR = 0.00708,
  SR = 0.09941,
  R = 0.3682,
  UC = 0.7589,
  C = 1,
}

/**
 * ガチャ
 */
export interface Gacha {
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
