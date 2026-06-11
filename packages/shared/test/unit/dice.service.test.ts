import { afterEach, describe, expect, it, vi } from 'vitest';
import { DICE_ROLE } from '../../src/constants/dice.js';
import {
  DiceRollError,
  DiceRollResult,
  choose,
  getCelo,
  getRole,
  judge,
  playCelo,
  playcelovs,
  rollAllDice,
  rollDice,
} from '../../src/services/dice.service.js';

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Math.random() が sequence の値を順に返すようにモックする。
 * 使い切った後は最後の値を返し続ける。
 */
function mockRandomSequence(sequence: number[]) {
  let i = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    const value = sequence[Math.min(i, sequence.length - 1)];
    i++;
    return value;
  });
}

describe('rollDice', () => {
  it('指定回数のダイスを振って集計を返す', () => {
    const result = rollDice(5, 6) as DiceRollResult;
    expect('results' in result).toBe(true);
    expect(result.results).toHaveLength(5);
    result.results.forEach((r) => {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
    });
    expect(result.sum).toBe(result.results.reduce((s, el) => s + el, 0));
    expect(result.max).toBe(Math.max(...result.results));
    expect(result.min).toBe(Math.min(...result.results));
    expect(result.average).toBe(result.sum / 5);
  });

  it('ダイスの数が0以下なら INVALID_NUMBER', () => {
    expect((rollDice(0, 6) as DiceRollError).type).toBe('INVALID_NUMBER');
    expect((rollDice(5, 0) as DiceRollError).type).toBe('INVALID_NUMBER');
    expect((rollDice(-1, 6) as DiceRollError).type).toBe('INVALID_NUMBER');
  });

  it('ダイスの数が1000以上なら TOO_MANY_DICE', () => {
    expect((rollDice(1000, 6) as DiceRollError).type).toBe('TOO_MANY_DICE');
  });

  it('結果文字列が4096文字以上なら MESSAGE_TOO_LONG', () => {
    // 999個 × 「1000, 」(6文字) = 約6000文字 で必ず超える
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    expect((rollDice(999, 1000) as DiceRollError).type).toBe('MESSAGE_TOO_LONG');
  });
});

describe('rollAllDice', () => {
  it('全員分の結果を降順で返す', () => {
    const result = rollAllDice(['alice', 'bob', 'carol']);
    expect(result.participants).toHaveLength(3);
    for (let i = 1; i < result.participants.length; i++) {
      expect(result.participants[i - 1].result).toBeGreaterThanOrEqual(result.participants[i].result);
    }
    expect(result.participants.map((p) => p.displayName).sort()).toEqual(['alice', 'bob', 'carol']);
  });
});

describe('getRole', () => {
  // getRole は 1つのダイスにつき [ションベン判定, 出目] の順で Math.random を2回呼ぶ
  it('ゾロ目(1) は ピンゾロ', () => {
    mockRandomSequence([0.5, 0.0, 0.5, 0.0, 0.5, 0.0]);
    const role = getRole();
    expect(role.role).toBe(DICE_ROLE.DICE_PINZORO.role);
    expect(role.rank).toBe(DICE_ROLE.DICE_PINZORO.rank);
    expect(role.dice).toEqual([1, 1, 1]);
  });

  it('ゾロ目(2以上) は ゾロ目 (power付き)', () => {
    mockRandomSequence([0.5, 0.2, 0.5, 0.2, 0.5, 0.2]);
    const role = getRole();
    expect(role.rank).toBe(DICE_ROLE.DICE_ZORO.rank);
    expect(role.power).toBe(2);
    expect(role.dice).toEqual([2, 2, 2]);
  });

  it('1,2,3 は 一二三', () => {
    mockRandomSequence([0.5, 0.0, 0.5, 0.2, 0.5, 0.4]);
    const role = getRole();
    expect(role.rank).toBe(DICE_ROLE.DICE_HIFUMI.rank);
  });

  it('4,5,6 は 四五六', () => {
    mockRandomSequence([0.5, 0.5, 0.5, 0.7, 0.5, 0.9]);
    const role = getRole();
    expect(role.rank).toBe(DICE_ROLE.DICE_SHIGORO.rank);
  });

  it('2つ揃いは残りの目が power', () => {
    mockRandomSequence([0.5, 0.2, 0.5, 0.2, 0.5, 0.7]);
    const role = getRole();
    expect(role.rank).toBe(DICE_ROLE.DICE_POWER.rank);
    expect(role.power).toBe(5);
    expect(role.role).toBe('5の目');
  });

  it('役なしは 目なし', () => {
    mockRandomSequence([0.5, 0.0, 0.5, 0.4, 0.5, 0.7]);
    const role = getRole();
    expect(role.rank).toBe(DICE_ROLE.DICE_MENASHI.rank);
  });

  it('ションベン判定 (r < 0.025)', () => {
    mockRandomSequence([0.01]);
    const role = getRole();
    expect(role.rank).toBe(DICE_ROLE.DICE_SHONBEN.rank);
    expect(role.dice).toEqual([-1, -1, -1]);
  });
});

describe('getCelo', () => {
  it('役 (rank > 0) が出たら途中で終了する', () => {
    // 1投目でピンゾロ
    mockRandomSequence([0.5, 0.0, 0.5, 0.0, 0.5, 0.0]);
    const results = getCelo(3);
    expect(results).toHaveLength(1);
    expect(results[0].rank).toBe(DICE_ROLE.DICE_PINZORO.rank);
  });

  it('一二三が出たら途中で終了する', () => {
    mockRandomSequence([0.5, 0.0, 0.5, 0.2, 0.5, 0.4]);
    const results = getCelo(3);
    expect(results).toHaveLength(1);
    expect(results[0].rank).toBe(DICE_ROLE.DICE_HIFUMI.rank);
  });

  it('目なしが続いたら指定回数まで振る', () => {
    // 目なし (1,3,5) を繰り返す
    mockRandomSequence([0.5, 0.0, 0.5, 0.4, 0.5, 0.7, 0.5, 0.0, 0.5, 0.4, 0.5, 0.7, 0.5, 0.0, 0.5, 0.4, 0.5, 0.7]);
    const results = getCelo(3);
    expect(results).toHaveLength(3);
  });
});

describe('judge', () => {
  it('rank が高い方が勝つ', () => {
    expect(judge({ ...DICE_ROLE.DICE_PINZORO, dice: [1, 1, 1] }, { ...DICE_ROLE.DICE_MENASHI, dice: [1, 3, 5] })).toBe(1);
    expect(judge({ ...DICE_ROLE.DICE_MENASHI, dice: [1, 3, 5] }, { ...DICE_ROLE.DICE_PINZORO, dice: [1, 1, 1] })).toBe(-1);
  });

  it('同 rank なら power で判定する', () => {
    const high = { ...DICE_ROLE.DICE_POWER, power: 5, dice: [2, 2, 5] };
    const low = { ...DICE_ROLE.DICE_POWER, power: 3, dice: [2, 2, 3] };
    expect(judge(high, low)).toBe(1);
    expect(judge(low, high)).toBe(-1);
  });

  it('同 rank 同 power なら引き分け', () => {
    const a = { ...DICE_ROLE.DICE_POWER, power: 5, dice: [2, 2, 5] };
    const b = { ...DICE_ROLE.DICE_POWER, power: 5, dice: [4, 4, 5] };
    expect(judge(a, b)).toBe(0);
  });
});

describe('playCelo', () => {
  it('最大ラウンド数までの結果を返す', () => {
    const results = playCelo(3);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.length).toBeLessThanOrEqual(3);
  });
});

describe('playcelovs', () => {
  it('最終役の judge 結果と winner が一致する', () => {
    for (let i = 0; i < 50; i++) {
      const { playerResults, enemyResults, winner } = playcelovs(3);
      const result = judge(playerResults[playerResults.length - 1], enemyResults[enemyResults.length - 1]);
      if (result > 0) {
        expect(winner).toBe('player');
      } else if (result < 0) {
        expect(winner).toBe('enemy');
      } else {
        expect(winner).toBe('draw');
      }
    }
  });
});

describe('choose', () => {
  it('選択肢の中から1つ返す', () => {
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(items).toContain(choose(items));
    }
  });
});
