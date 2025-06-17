import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { Logger } from '../../common/logger.js';

export interface InteractionHandler {
  logger: Logger;

  /**
   * スラッシュコマンドの実行時メソッド
   * @param interaction スラッシュコマンドのインタラクション
   * @returns
   */
  execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>;
}
