import { EmbedBuilder, Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import { CONFIG, LiteLLMModel } from '../../../../config/config.js';
import * as ChatService from '../../../../service/chat.service.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class ModelHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    const dest = args[0];
    const model = args[1];

    const defaultModel = CONFIG.OPENAI.DEFAULT_MODEL;
    const lowModel = CONFIG.OPENAI.LOW_MODEL;
    const highModel = CONFIG.OPENAI.HIGH_MODEL;

    if (dest == null || model == null) {
      const send = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`現在のモデル`)
        .setDescription(`default: ${defaultModel}\ng3: ${lowModel}\ng4: ${highModel}`);

      message.reply({ embeds: [send] });
      return;
    }

    await ChatService.setModel(dest as 'default' | 'g3' | 'g4', model as LiteLLMModel);
    const send = new EmbedBuilder().setColor('#00ffff').setTitle(`モデル変更`).setDescription(`モデルを${model}に変更`);

    message.reply({ embeds: [send] });
  }
}
