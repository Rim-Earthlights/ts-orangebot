import { EmbedBuilder, Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import * as PhotoService from '../../../services/photo.service.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class PhotoHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'cat': {
        await this.handleCatCommand(message);
        break;
      }
    }
  }

  private async handleCatCommand(message: Message): Promise<void> {
    const picture = await PhotoService.cat();

    const send = new EmbedBuilder().setColor('#00cccc').setTitle(`めあの写真`).setImage(picture);

    message.reply({ embeds: [send] });
  }
}
