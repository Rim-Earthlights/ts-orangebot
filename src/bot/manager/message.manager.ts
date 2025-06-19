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

    const modelHandler = new ModelHandler(this.logger);
    this.handlers.set('model', modelHandler);
    this.handlers.set('model-info', modelHandler);

    const diceHandler = new DiceHandler(this.logger);
    this.handlers.set('dice', diceHandler);
    this.handlers.set('dall', diceHandler);

    const chatHandler = new ChatHandler(this.logger);
    this.handlers.set('gpt', chatHandler);
    this.handlers.set('mikan', chatHandler);
    this.handlers.set('g3', chatHandler);
    this.handlers.set('g4', chatHandler);
    this.handlers.set('raw', chatHandler);
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
    await handler.execute(this.message, this.command, this.args);
  }
}
