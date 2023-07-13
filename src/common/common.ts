/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CONFIG } from '../config/config.js';
import { ENABLE_FUNCTION, functionNames } from '../constant/constants.js';

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
    const rndArray: number[] = [];
    for (let i = 0; i <= max; i++) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const tmp = getRndNumber(0, max);
            if (!rndArray.includes(tmp)) {
                rndArray.push(tmp);
                break;
            }
        }
    }
    return rndArray;
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

/**
 * APIキーの有無で機能を切り替える
 */
export function switchFunctionByAPIKey() {
    if (CONFIG.FORECAST.KEY) {
        ENABLE_FUNCTION.find((f) => f.name === functionNames.FORECAST)!.enable = true;
    }
    if (CONFIG.YOUTUBE.KEY) {
        ENABLE_FUNCTION.find((f) => f.name === functionNames.YOUTUBE)!.enable = true;
    }
    if (CONFIG.OPENAI.KEY) {
        ENABLE_FUNCTION.find((f) => f.name === functionNames.GPT)!.enable = true;
    }
    if (CONFIG.OPENAI.ACCESSTOKEN) {
        ENABLE_FUNCTION.find((f) => f.name === functionNames.GPT_WITHOUT_KEY)!.enable = true;
    }
}

/**
 * 機能が有効かどうかを返す
 * @param name
 * @returns
 */
export function isEnableFunction(name: functionNames) {
    return ENABLE_FUNCTION.find((f) => f.name === name)!.enable;
}
