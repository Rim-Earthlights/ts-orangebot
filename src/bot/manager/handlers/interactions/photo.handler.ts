import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import * as PhotoService from '../../../services/photo.service.js';

export class PhotoHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { commandName } = interaction;

    switch (commandName) {
      case 'cat': {
        await this.handleCatCommand(interaction);
        break;
      }
    }
  }

  private async handleCatCommand(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const picture = await PhotoService.cat();

    const send = new EmbedBuilder().setColor('#00cccc').setTitle(`めあの写真`).setImage(picture);

    await interaction.reply({ embeds: [send] });
  }
}
