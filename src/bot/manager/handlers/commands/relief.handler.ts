import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import { checkUserType } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { UsersType } from '../../../../model/models/users.js';
import { UsersRepository } from '../../../../model/repository/usersRepository.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class ReliefHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    if (!message.guild) {
      return;
    }
    
    const channel = message.channel;
    if (!channel || channel.type === ChannelType.GroupDM) {
      return;
    }
    
    if (!checkUserType(message.guild.id, message.author.id, UsersType.OWNER)) {
      return;
    }

    const num = Number(args[0]);
    if (num <= 0) {
      return;
    }

    const userRepository = new UsersRepository();
    await userRepository.relief(message.guild.id, num);

    const send = new EmbedBuilder()
      .setColor('#ffcc00')
      .setTitle(`詫び石の配布`)
      .setDescription(`${num} 回のガチャチケットを配布しました`);
    await channel.send({ embeds: [send] });
  }
}