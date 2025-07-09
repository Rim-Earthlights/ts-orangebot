import { EmbedBuilder, Message } from 'discord.js';
import { isEnableFunction } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { CONFIG, LITELLM_MODEL } from '../../../../config/config.js';
import { LiteLLMMode } from '../../../../constant/chat/chat.js';
import { functionNames } from '../../../../constant/constants.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class ChatHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    if (!isEnableFunction(functionNames.GPT)) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`機能が有効化されていません。`);

      message.reply({ content: `機能が有効化されてないよ！(GPT)`, embeds: [send] });
      return;
    }

    const chat = args.join(' ');

    switch (command) {
      case 'raw': {
        await DotBotFunctions.Chat.talk(message, chat, LiteLLMMode.NOPROMPT);
        break;
      }
      case 'gpt':
      case 'mikan': {
        await DotBotFunctions.Chat.talk(message, chat, LiteLLMMode.DEFAULT);
        break;
      }
      case 'g3': {
        await DotBotFunctions.Chat.talk(message, chat, LiteLLMMode.DEFAULT);
        break;
      }
      case 'g4': {
        await DotBotFunctions.Chat.talk(message, chat, LiteLLMMode.DEFAULT);
        break;
      }
    }
  }
}
