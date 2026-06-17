import { afterEach, describe, expect, it, vi } from 'vitest';
import { arrayEquals, getIntArray, getRndArray, getRndNumber } from '../../src/common/random.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getRndNumber', () => {
  it('n-mの範囲の整数を返す', () => {
    for (let i = 0; i < 100; i++) {
      const result = getRndNumber(1, 6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('Math.random() = 0 のとき最小値を返す', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getRndNumber(3, 10)).toBe(3);
  });

  it('Math.random() が 1 に近いとき最大値を返す', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    expect(getRndNumber(3, 10)).toBe(10);
  });
});

describe('getRndArray', () => {
  it('0からmax-1までの重複しない配列を返す', () => {
    const result = getRndArray(10);
    expect(result).toHaveLength(10);
    expect([...result].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe('getIntArray', () => {
  it('1からmaxまでの重複しない配列を返す', () => {
    const result = getIntArray(10);
    expect(result).toHaveLength(10);
    expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('arrayEquals', () => {
  it('順序が違っても同じ要素なら true', () => {
    expect(arrayEquals([3, 1, 2], [1, 2, 3])).toBe(true);
  });

  it('要素が異なれば false', () => {
    expect(arrayEquals([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it('長さが異なれば false', () => {
    expect(arrayEquals([1, 2], [1, 2, 3])).toBe(false);
  });
});
