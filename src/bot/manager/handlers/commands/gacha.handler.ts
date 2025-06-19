import { Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class GachaHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'gacha':
      case 'g': {
        await DotBotFunctions.Gacha.pickGacha(message, args);
        break;
      }
      case 'gp': {
        await DotBotFunctions.Gacha.showPercent(message);
        break;
      }
      case 'gl': {
        await DotBotFunctions.Gacha.pickGacha(message, ['limit']);
        break;
      }
      case 'give': {
        const uid = args[0];
        const iid = Number(args[1]);
        
        await DotBotFunctions.Gacha.givePresent(message, uid, iid);
        break;
      }
    }
  }
}