import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import * as BotFunctions from '../../../function/index.js';

export class DeleteHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const last = interaction.options.getBoolean('last') ?? undefined;
    await BotFunctions.Chat.deleteChatData(interaction, last);
  }
}
