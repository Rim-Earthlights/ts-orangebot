import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { InteractionHandler } from './interaction.handler.js';
import { PingHandler } from './handlers/interactions/ping.handler.js';
import { DcHandler } from './handlers/interactions/dc.handler.js';
import { MuteHandler } from './handlers/interactions/mute.handler.js';
import { EraseHandler } from './handlers/interactions/erase.handler.js';
import { ChatHandler } from './handlers/interactions/chat.handler.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';
import { interactionSelector } from '../commands.js';

/**
 * スラッシュコマンドのマネージャー
 */
export class InteractionManager {
  private readonly logger = new Logger();
  private interaction: ChatInputCommandInteraction<CacheType>;
  private handlers: Map<string, InteractionHandler> = new Map();

  constructor(interaction: ChatInputCommandInteraction<CacheType>) {
    this.interaction = interaction;
    this.handlers.set('ping', new PingHandler(this.logger));
    this.handlers.set('dc', new DcHandler(this.logger));
    this.handlers.set('mute', new MuteHandler(this.logger));
    this.handlers.set('erase', new EraseHandler(this.logger));
    this.handlers.set('chat', new ChatHandler(this.logger));
  }

  /**
   * 各スラッシュコマンドのハンドラーを実行
   * @returns
   */
  async handle() {
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

    const handler = this.handlers.get(this.interaction.commandName);
    if (!handler) {
      /** 実装終了後削除予定 */
      await this.logger.info(
        'interaction-handler-not-implemented',
        [`Command: ${this.interaction.commandName}`],
        this.interaction.guild?.id,
        this.interaction.channel?.id,
        this.interaction.user.id
      );
      await interactionSelector(this.interaction);
      return;
    }
    await handler.execute(this.interaction);
  }
}
