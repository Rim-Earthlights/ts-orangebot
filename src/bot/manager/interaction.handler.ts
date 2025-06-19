import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BaseHandler } from './base.handler.js';

export interface InteractionHandler {
  /**
   * スラッシュコマンドの実行時メソッド
   * @param interaction スラッシュコマンドのインタラクション
   * @returns
   */
  execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>;
}

/**
 * InteractionHandlerの基底クラス
 * loggerの初期化を統一する
 */
export abstract class BaseInteractionHandler extends BaseHandler implements InteractionHandler {
  abstract execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>;
}
