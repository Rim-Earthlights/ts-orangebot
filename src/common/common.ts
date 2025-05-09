/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CONFIG } from '../config/config.js';
import { ENABLE_FUNCTION, functionNames } from '../constant/constants.js';
import { UsersType } from '../model/models/users.js';
import { UsersRepository } from '../model/repository/usersRepository.js';

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

export const checkUserType = async (gid: string, uid: string, type: UsersType): Promise<boolean> => {
  const usersRepository = new UsersRepository();
  const userType = await usersRepository.getUsersType(gid, uid);

  if (!userType) {
    return false;
  }
  if (type === userType || userType === UsersType.OWNER) {
    return true;
  }
  return false;
};

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
