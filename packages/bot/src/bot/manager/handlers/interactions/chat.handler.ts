import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { CONFIG } from '../../../../config/config.js';
import { LiteLLMMode } from '../../../../constant/chat/chat.js';
import { functionNames } from '../../../../constant/constants.js';
import { isEnableFunction } from '../../../../common/common.js';
import * as BotFunctions from '../../../function/index.js';

export class ChatHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    if (!isEnableFunction(functionNames.GPT)) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`機能が有効化されていません。`);

      interaction.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
      return;
    }

    await interaction.deferReply();
    const text = interaction.options.getString('text')!;
    await BotFunctions.Chat.talk(interaction, text, LiteLLMMode.DEFAULT);
  }
}
