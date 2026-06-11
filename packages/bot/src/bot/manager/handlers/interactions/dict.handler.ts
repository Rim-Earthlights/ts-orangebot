import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import * as BotFunctions from '../../../function/index.js';

export class DictHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    switch (interaction.options.getSubcommand()) {
      case 'add': {
        await BotFunctions.Dict.add(interaction);
        break;
      }
      case 'list': {
        await BotFunctions.Dict.list(interaction);
        break;
      }
      case 'remove': {
        await BotFunctions.Dict.remove(interaction);
        break;
      }
    }
  }
}
