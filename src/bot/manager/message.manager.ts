import { Message } from 'discord.js';
import { Logger } from '../../common/logger.js';
import { MessageHandler } from './message.handler.js';
import { commandSelector } from '../commands.js';
import { ModelHandler } from './handlers/commands/model.handler.js';
import { DiceHandler } from './handlers/commands/dice.handler.js';
import { ChatHandler } from './handlers/commands/chat.handler.js';
import { HelpHandler } from './handlers/commands/help.handler.js';
import { TopicHandler } from './handlers/commands/topic.handler.js';
import { MemoryHandler } from './handlers/commands/memory.handler.js';
import { SpeechHandler } from './handlers/commands/speech.handler.js';
import { PicHandler } from './handlers/commands/pic.handler.js';
import { WeatherHandler } from './handlers/commands/weather.handler.js';
import { LuckHandler } from './handlers/commands/luck.handler.js';
import { GachaHandler } from './handlers/commands/gacha.handler.js';
import { MusicHandler } from './handlers/commands/music.handler.js';
import { MusicListHandler } from './handlers/commands/musiclist.handler.js';

export class MessageManager {
  logger = new Logger();
  message: Message;
  command: string;
  args: string[];
  private handlers: Map<string, MessageHandler> = new Map();

  constructor(message: Message) {
    this.logger = new Logger();
    this.message = message;
    const content = message.content.replace('.', '').replace(/　/g, ' ').trimEnd().split(' ');
    this.command = content[0];
    this.args = content.slice(1);

    // Register handlers
    this.handlers.set('help', new HelpHandler(this.logger));
    this.handlers.set('memory', new MemoryHandler(this.logger));
    this.handlers.set('topic', new TopicHandler(this.logger));
    this.handlers.set('speech', new SpeechHandler(this.logger));
    this.handlers.set('pic', new PicHandler(this.logger));
    this.handlers.set('tenki', new WeatherHandler(this.logger));
    this.handlers.set('luck', new LuckHandler(this.logger));
    
    // Gacha commands
    const gachaHandler = new GachaHandler(this.logger);
    this.handlers.set('gacha', gachaHandler);
    this.handlers.set('g', gachaHandler);
    this.handlers.set('gp', gachaHandler);
    this.handlers.set('gl', gachaHandler);
    this.handlers.set('give', gachaHandler);

    const modelHandler = new ModelHandler(this.logger);
    this.handlers.set('model', modelHandler);
    this.handlers.set('model-info', modelHandler);

    const diceHandler = new DiceHandler(this.logger);
    this.handlers.set('dice', diceHandler);
    this.handlers.set('dall', diceHandler);
    this.handlers.set('celo', diceHandler);
    this.handlers.set('celovs', diceHandler);

    const chatHandler = new ChatHandler(this.logger);
    this.handlers.set('gpt', chatHandler);
    this.handlers.set('mikan', chatHandler);
    this.handlers.set('g3', chatHandler);
    this.handlers.set('g4', chatHandler);
    this.handlers.set('raw', chatHandler);

    // Music commands
    const musicHandler = new MusicHandler(this.logger);
    this.handlers.set('play', musicHandler);
    this.handlers.set('pl', musicHandler);
    this.handlers.set('search', musicHandler);
    this.handlers.set('sc', musicHandler);
    this.handlers.set('interrupt', musicHandler);
    this.handlers.set('pi', musicHandler);
    this.handlers.set('stop', musicHandler);
    this.handlers.set('st', musicHandler);
    this.handlers.set('rem', musicHandler);
    this.handlers.set('rm', musicHandler);
    this.handlers.set('pause', musicHandler);
    this.handlers.set('q', musicHandler);
    this.handlers.set('silent', musicHandler);
    this.handlers.set('si', musicHandler);

    // Music list commands
    const musicListHandler = new MusicListHandler(this.logger);
    this.handlers.set('list', musicListHandler);
  }

  async handle() {
    const handler = this.handlers.get(this.command);
    if (!handler) {
      /** 実装完了後削除 */
      await this.logger.info(
        'handler-not-implemented',
        [`Command: ${this.command}`],
        this.message.guild?.id,
        this.message.channel?.id,
        this.message.author.id
      );
      await commandSelector(this.message);
      return;
    }
    await this.logger.info(
      'message-received | Command',
      [`Command: ${this.command}`],
      this.message.guild?.id,
      this.message.channel?.id,
      this.message.author.id
    );
    await handler.execute(this.message, this.command, this.args);
  }
}
