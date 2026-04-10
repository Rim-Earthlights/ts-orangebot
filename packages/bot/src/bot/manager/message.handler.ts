import { Message } from 'discord.js';
import { BaseHandler } from './base.handler.js';

export interface MessageHandler {
  /**
   * メッセージコマンドの実行時メソッド
   * @param message メッセージ
   * @param command コマンド
   * @param args コマンドの引数
   * @returns
   */
  execute(message: Message, command: string, args: string[]): Promise<void>;
}

/**
 * MessageHandlerの基底クラス
 * loggerの初期化を統一する
 */
export abstract class BaseMessageHandler extends BaseHandler implements MessageHandler {
  abstract execute(message: Message, command: string, args: string[]): Promise<void>;
}
