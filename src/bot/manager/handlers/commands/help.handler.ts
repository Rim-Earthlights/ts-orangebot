import { ChannelType, Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import { HELP_COMMANDS } from '../../../../constant/constants.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class HelpHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    HELP_COMMANDS.map(async (c) => {
      if (message.channel.type === ChannelType.GroupDM) {
        return;
      }
      await message.channel.send({ embeds: [c] });
    });
  }
}
