import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import { checkUserType } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { UsersType } from '../../../../model/models/users.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class PopupRuleHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    if (!message.guild) {
      return;
    }
    
    if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
      return;
    }
    
    const channel = message.channel;
    if (channel && channel.type !== ChannelType.GroupDM) {
      const send = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle(`ルールを読んだ`)
        .setDescription('リアクションをすると全ての機能が使えるようになります');
      const result = await channel.send({ embeds: [send] });
      result.react('✅');
      const m = await channel.send('pop-up success.');
      await m.delete();
    }
  }
}