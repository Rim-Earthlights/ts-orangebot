import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { HELP_COMMANDS } from '../../../../constant/constants.js';

export class HelpHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.reply({ content: 'ヘルプを表示', ephemeral: true });
    HELP_COMMANDS.map(async (c) => await interaction.followUp({ embeds: [c], ephemeral: true }));
  }
}