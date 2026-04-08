import { arrayEquals, getRndNumber } from '../../common/common.js';
import { DICE_ROLE, DiceRole } from '../../constant/dice/dice.js';

export interface DiceRollResult {
  results: number[];
  sum: number;
  max: number;
  min: number;
  average: number;
}

export interface DiceAllResult {
  participants: { displayName: string; result: number }[];
}

export interface DiceRollError {
  type: 'INVALID_ARGS' | 'INVALID_NUMBER' | 'TOO_MANY_DICE' | 'MESSAGE_TOO_LONG';
  message: string;
}

/**
 * サイコロを振る
 * @param diceNum 振る回数
 * @param diceMax 面数
 * @returns 結果またはエラー
 */
export function rollDice(diceNum: number, diceMax: number): DiceRollResult | DiceRollError {
  if (diceNum <= 0 || diceMax <= 0) {
    return {
      type: 'INVALID_NUMBER',
      message: 'ダイスの数が0以下です'
    };
  }

  if (diceNum >= 1000) {
    return {
      type: 'TOO_MANY_DICE',
      message: 'ダイスの数が多すぎます'
    };
  }

  const results = [];
  for (let i = 0; i < diceNum; i++) {
    results.push(getRndNumber(1, diceMax));
  }

  const diceResult = results.join(', ');
  if (diceResult.length >= 4096) {
    return {
      type: 'MESSAGE_TOO_LONG',
      message: '4096文字以上の文字の送信に失敗'
    };
  }

  const sum = results.reduce((sum, el) => sum + el, 0);
  const max = Math.max(...results);
  const min = Math.min(...results);
  const average = sum / diceNum;

  return {
    results,
    sum,
    max,
    min,
    average
  };
}

/**
 * 全員で100面ダイスを振る
 * @param members メンバーのdisplayName配列
 * @returns 結果
 */
export function rollAllDice(members: string[]): DiceAllResult {
  const participants = members.map((displayName) => ({
    displayName,
    result: getRndNumber(1, 100)
  }));

  participants.sort((a, b) => b.result - a.result);

  return { participants };
}

/**
 * チンチロリンであそぶ
 * @param rounds ラウンド数
 * @returns チンチロリンの結果
 */
export function playCelo(rounds: number = 3): DiceRole[] {
  return getCelo(rounds);
}

/**
 * チンチロリンで勝負する
 * @param rounds ラウンド数
 * @returns あなたと相手の結果、勝敗判定
 */
export function playcelovs(rounds: number = 3): {
  playerResults: DiceRole[];
  enemyResults: DiceRole[];
  winner: 'player' | 'enemy' | 'draw';
} {
  const playerResults = getCelo(rounds);
  const enemyResults = getCelo(rounds);
  
  const playerFinalRole = playerResults[playerResults.length - 1];
  const enemyFinalRole = enemyResults[enemyResults.length - 1];
  
  const judgeResult = judge(playerFinalRole, enemyFinalRole);
  
  let winner: 'player' | 'enemy' | 'draw';
  if (judgeResult > 0) {
    winner = 'player';
  } else if (judgeResult < 0) {
    winner = 'enemy';
  } else {
    winner = 'draw';
  }

  return {
    playerResults,
    enemyResults,
    winner
  };
}

/**
 * チンチロリンを振る 出た場合は回数未満でも終了する
 * @param n 回数
 */
export function getCelo(n: number): DiceRole[] {
  const celo = [];
  for (let i = 0; i < n; i++) {
    const temp = getRole();
    celo.push(temp);
    if (temp.rank > 0) {
      break;
    }
    if (temp.rank === DICE_ROLE.DICE_HIFUMI.rank) {
      break;
    }
  }

  return celo;
}

/**
 * チンチロリンを一度振る
 * @returns
 */
export function getRole(): DiceRole {
  const dice: number[] = [];
  for (let i = 0; i < 3; i++) {
    // ションベン
    const r = Math.random();
    if (r < 0.025) {
      return { ...DICE_ROLE.DICE_SHONBEN, dice: [-1, -1, -1] };
    }
    dice.push(getRndNumber(1, 6));
  }

  // ゾロ目判定
  if (dice.every((d) => d === dice[0])) {
    if (dice[0] === 1) {
      return { ...DICE_ROLE.DICE_PINZORO, dice };
    }
    const power = dice[0];
    const role = DICE_ROLE.DICE_ZORO.role.replace('%POWER%', power.toString());
    return { ...DICE_ROLE.DICE_ZORO, role, power, dice };
  }
  // ヒフミ, シゴロ
  if (arrayEquals(dice, [1, 2, 3])) {
    return { ...DICE_ROLE.DICE_HIFUMI, dice };
  }
  if (arrayEquals(dice, [4, 5, 6])) {
    return { ...DICE_ROLE.DICE_SHIGORO, dice };
  }
  dice.sort();

  // 3つの数字をソートして数字が被ってる場合は
  // 真ん中の数字を取ればどちらかと必ずかぶるはず
  if (dice[0] === dice[1] || dice[1] === dice[2]) {
    const power = dice.filter((d) => d !== dice[1])[0];
    const role = DICE_ROLE.DICE_POWER.role.replace('%POWER%', power.toString());
    return { ...DICE_ROLE.DICE_POWER, role, power, dice };
  }

  return { ...DICE_ROLE.DICE_MENASHI, dice };
}

/**
 * 出た目で勝負を判定する
 * @param t
 * @param v
 * @returns
 */
export function judge(t: DiceRole, v: DiceRole): number {
  const rank = t.rank - v.rank;
  if (rank !== 0) {
    if (rank > 0) {
      return 1;
    }
    return -1;
  }
  if (t.power && v.power) {
    const power = t.power - v.power;
    if (power !== 0) {
      if (power > 0) {
        return 1;
      }
      return -1;
    }
  }
  return 0;
}

/**
 * アイテムをランダムに選ぶ
 * @param items
 */
export function choose(items: string[]): string {
  const rnd = getRndNumber(0, items.length - 1);
  return items[rnd];
}