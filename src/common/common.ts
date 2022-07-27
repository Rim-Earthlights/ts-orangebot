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
