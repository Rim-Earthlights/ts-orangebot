import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { getRndNumber } from '../../../../common/common.js';
import { TOPIC } from '../../../../constant/words/topic.js';

export class TopicHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const num = getRndNumber(0, TOPIC.length - 1);
    const send = new EmbedBuilder().setColor('#ff9900').setTitle(`こんなのでました～！`).setDescription(TOPIC[num]);

    interaction.reply({ embeds: [send] });
  }
}