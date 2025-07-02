import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { InteractionHandler } from './interaction.handler.js';
import { PingHandler } from './handlers/interactions/ping.handler.js';
import { DcHandler } from './handlers/interactions/dc.handler.js';
import { MuteHandler } from './handlers/interactions/mute.handler.js';
import { DeleteHandler } from './handlers/interactions/delete.handler.js';
import { ChatHandler } from './handlers/interactions/chat.handler.js';
import { SpeakHandler } from './handlers/interactions/speak.handler.js';
import { HelpHandler } from './handlers/interactions/help.handler.js';
import { GachaHandler } from './handlers/interactions/gacha.handler.js';
import { DiceHandler } from './handlers/interactions/dice.handler.js';
import { ItoHandler } from './handlers/interactions/ito.handler.js';
import { TimeoutHandler } from './handlers/interactions/timeout.handler.js';
import { RoomHandler } from './handlers/interactions/room.handler.js';
import { NicknameHandler } from './handlers/interactions/nickname.handler.js';
import { MemoryHandler } from './handlers/interactions/memory.handler.js';
import { TopicHandler } from './handlers/interactions/topic.handler.js';
import { AcceptHandler } from './handlers/interactions/accept.handler.js';
import { UserTypeHandler } from './handlers/interactions/user-type.handler.js';
import { RevertHandler } from './handlers/interactions/revert.handler.js';
import { HistoryHandler } from './handlers/interactions/history.handler.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';
import { RipHandler } from './handlers/interactions/rip.handler.js';

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
    this.handlers.set('rip', new RipHandler(this.logger));
    this.handlers.set('mute', new MuteHandler(this.logger));
    this.handlers.set('delete', new DeleteHandler(this.logger));
    this.handlers.set('chat', new ChatHandler(this.logger));
    this.handlers.set('speak', new SpeakHandler(this.logger));
    this.handlers.set('help', new HelpHandler(this.logger));

    // Dice commands
    const diceHandler = new DiceHandler(this.logger);
    this.handlers.set('dice', diceHandler);
    this.handlers.set('dall', diceHandler);

    // Gacha commands
    const gachaHandler = new GachaHandler(this.logger);
    this.handlers.set('gacha', gachaHandler);
    this.handlers.set('gc', gachaHandler);
    this.handlers.set('gl', gachaHandler);

    // Room commands
    const roomHandler = new RoomHandler(this.logger);
    this.handlers.set('room', roomHandler);
    this.handlers.set('rn', roomHandler);
    this.handlers.set('custom', roomHandler);

    // ITO game commands
    const itoHandler = new ItoHandler(this.logger);
    this.handlers.set('genito', itoHandler);
    this.handlers.set('ito', itoHandler);

    this.handlers.set('timeout', new TimeoutHandler(this.logger));
    this.handlers.set('nickname', new NicknameHandler(this.logger));
    this.handlers.set('memory', new MemoryHandler(this.logger));
    this.handlers.set('topic', new TopicHandler(this.logger));
    this.handlers.set('accept', new AcceptHandler(this.logger));
    this.handlers.set('user-type', new UserTypeHandler(this.logger));
    this.handlers.set('revert', new RevertHandler(this.logger));
    this.handlers.set('history', new HistoryHandler(this.logger));
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
      await this.logger.error(
        'interaction-handler-not-found',
        [`Command: ${this.interaction.commandName}`],
        this.interaction.guild?.id,
        this.interaction.channel?.id,
        this.interaction.user.id
      );
      await this.interaction.reply({ content: 'コマンドが見つかりませんでした。', ephemeral: true });
      return;
    }
    await handler.execute(this.interaction);
  }
}
