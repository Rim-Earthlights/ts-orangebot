/**
 * サイコロ情報
 */
export interface DiceRole {
  role: string;
  rank: number;
  dice: number[];
  power?: number;
}

/**
 * サイコロの役
 */
export const DICE_ROLE = {
  DICE_SHONBEN: { role: 'ションベン', rank: -2 },
  DICE_HIFUMI: { role: '一二三', rank: -1 },
  DICE_MENASHI: { role: '目なし', rank: 0 },
  DICE_POWER: { role: '%POWER%の目', rank: 1 },
  DICE_SHIGORO: { role: '四五六', rank: 2 },
  DICE_ZORO: { role: 'ゾロ目', rank: 3 },
  DICE_PINZORO: { role: 'ピンゾロ', rank: 4 },
};
