/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CONFIG } from '../config/config.js';
import { ENABLE_FUNCTION, functionNames } from '../constant/constants.js';
import { UsersType } from "@orangebot/shared";
import { UsersRepository } from "@orangebot/shared";

// 純粋な乱数・配列ユーティリティは @orangebot/shared に移動した (Phase 2-1)
export { arrayEquals, getIntArray, getRndArray, getRndNumber } from '@orangebot/shared';

/**
 * バッファからMIMEタイプを検出する
 * @param buffer バッファ
 * @returns MIMEタイプ
 */
export function detectMimeType(buffer: Buffer): string {
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return 'image/png';
  }
  // JPEG: FF D8
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return 'image/jpeg';
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49) {
    return 'image/webp';
  }
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49) {
    return 'image/gif';
  }
  return 'image/png'; // fallback
}


/**
 * ユーザーの権限をチェックする
 * @param gid サーバーID
 * @param uid ユーザーID
 * @param type 権限
 * @returns 権限があるかどうか
 */
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
