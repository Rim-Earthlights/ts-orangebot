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
 * ガチャの等級一覧 (高い順)
 */
export const GACHA_RARE_TIERS = ['UUR', 'UR', 'SSR', 'SR', 'R', 'UC', 'C'] as const;
