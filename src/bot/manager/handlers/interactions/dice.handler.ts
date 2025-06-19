import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import * as BotFunctions from '../../../function/index.js';

export class DiceHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const num = interaction.options.getNumber('num') ?? 1;
    const max = interaction.options.getNumber('max') ?? 100;
    await BotFunctions.Dice.rollHideDice(interaction, num, max);
  }
}