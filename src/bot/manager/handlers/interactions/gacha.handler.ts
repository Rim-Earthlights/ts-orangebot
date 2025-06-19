import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { LogLevel } from '../../../../type/types.js';
import * as BotFunctions from '../../../function/index.js';

export class GachaHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { commandName } = interaction;

    switch (commandName) {
      case 'gacha': {
        await this.handleGachaCommand(interaction);
        break;
      }
      case 'gc': {
        await this.handleGcCommand(interaction);
        break;
      }
      case 'gl': {
        await this.handleGlCommand(interaction);
        break;
      }
    }
  }

  private async handleGachaCommand(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await Logger.put({
      guild_id: interaction.guild?.id,
      channel_id: interaction.channel?.id,
      user_id: interaction.user.id,
      level: LogLevel.INFO,
      event: 'received-command/gacha',
      message: [`${interaction}`],
    });

    const type = interaction.options.getSubcommand();
    switch (type) {
      case 'pick': {
        await interaction.deferReply();
        const num = interaction.options.getNumber('num') ?? undefined;
        const limit = interaction.options.getBoolean('limit') ?? undefined;

        await BotFunctions.Gacha.pickGacha(interaction, limit, num);
        break;
      }
      case 'list': {
        await BotFunctions.Gacha.getGachaInfo(interaction);
        break;
      }
      case 'extra': {
        await interaction.deferReply();
        await BotFunctions.Gacha.extraPick(
          interaction,
          interaction.options.getNumber('num') ?? undefined,
          interaction.options.getString('item') ?? undefined
        );
        break;
      }
    }
  }

  private async handleGcCommand(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();
    const num = interaction.options.getNumber('num') ?? undefined;
    const limit = interaction.options.getBoolean('limit') ?? undefined;

    await BotFunctions.Gacha.pickGacha(interaction, limit, num);
  }

  private async handleGlCommand(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();
    await BotFunctions.Gacha.pickGacha(interaction, true);
  }
}