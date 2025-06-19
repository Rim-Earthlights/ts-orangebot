import { EmbedBuilder, Message } from 'discord.js';
import { getRndNumber } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { TOPIC } from '../../../../constant/words/topic.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class TopicHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    const num = getRndNumber(0, TOPIC.length - 1);
    const send = new EmbedBuilder().setColor('#ff9900').setTitle(`こんなのでました～！`).setDescription(TOPIC[num]);

    message.reply({ embeds: [send] });
  }
}