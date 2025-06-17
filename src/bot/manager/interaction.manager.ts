import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { InteractionHandler } from './interaction.handler.js';
import { PingHandler } from '../interactions/ping.handler.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';

/**
 * スラッシュコマンドのマネージャー
 */
export class InteractionManager {
  private readonly logger = new Logger();
  private interaction: ChatInputCommandInteraction<CacheType>;
  private handlers: Map<string, InteractionHandler> = new Map();

  constructor(interaction: ChatInputCommandInteraction<CacheType>) {
    this.interaction = interaction;
    this.handlers.set('ping', new PingHandler());
  }

  /**
   * 各スラッシュコマンドのハンドラーを実行
   * @returns
   */
  async handle() {
    const handler = this.handlers.get(this.interaction.commandName);
    if (!handler) {
      return;
    }

    await Logger.put({
      guild_id: this.interaction.guild?.id,
      channel_id: this.interaction.channel?.id,
      user_id: this.interaction.user.id,
      level: LogLevel.INFO,
      event: `interaction-received | ${this.interaction.commandName}`,
      message: [
        `cid: ${this.interaction.channel?.id}`,
        `author: ${this.interaction.user.displayName}`,
        `content: ${this.interaction}`,
      ],
    });
    await handler.execute(this.interaction);
  }
}
