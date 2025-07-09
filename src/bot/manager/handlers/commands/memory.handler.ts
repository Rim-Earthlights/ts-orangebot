import { Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class MemoryHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    await DotBotFunctions.Chat.setMemory(message);
  }
}