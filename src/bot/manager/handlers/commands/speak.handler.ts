import { Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import { BaseMessageHandler } from '../../message.handler.js';
import * as DotBotFunctions from '../../../dot_function/index.js';

export class SpeakHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'speak': {
        await DotBotFunctions.Speak.call(message);
        break;
      }
    }
  }
}
