/**
 * 乱数生成機
 * n-mまでの整数を出力する.
 * @param n 最小値
 * @param m 最大値
 */
export function getRndNumber(n: number, m: number) {
  return Math.floor(Math.random() * (m + 1 - n)) + n;
}

/**
 * 0 - indexまでの重複しない乱数を生成
 */
export function getRndArray(max: number): number[] {
  // 0 から max - 1までの連続した数値の配列を生成
  const arr = Array.from({ length: max }, (_, i) => i);

  // 配列をシャッフル
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * 1 - indexまでの重複しない乱数を生成
 */
export function getIntArray(max: number): number[] {
  // 1 から maxまでの連続した数値の配列を生成
  const arr = Array.from({ length: max }, (_, i) => i + 1);

  // 配列をシャッフル
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * 2つの配列が全て等しいかチェックする
 * @param t 配列
 * @param v 配列
 * @returns boolean
 */
export function arrayEquals(t: number[], v: number[]): boolean {
  if (t.length !== v.length) {
    return false;
  }
  t.sort();
  v.sort();

  for (let i = 0; i < t.length; i++) {
    if (t[i] !== v[i]) {
      return false;
    }
  }
  return true;
}
