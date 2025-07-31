import { ChannelType, Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import { HELP_COMMANDS, HELP_COMMANDS_INTERACTIONS } from '../../../../constant/constants.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class HelpHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    for (const c of HELP_COMMANDS) {
      if (message.channel.type === ChannelType.GroupDM) {
        continue;
      }
      await message.channel.send({ embeds: [c] });
    }
    for (const c of HELP_COMMANDS_INTERACTIONS) {
      if (message.channel.type === ChannelType.GroupDM) {
        continue;
      }
      await message.channel.send({ embeds: [c] });
    }
  }
}
