import { EmbedBuilder, Message } from 'discord.js';
import { isEnableFunction } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { functionNames } from '../../../../constant/constants.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class WeatherHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    if (!isEnableFunction(functionNames.FORECAST)) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`機能が有効化されていません。`);

      message.reply({ content: `機能が有効化されてないよ！(FORECAST)`, embeds: [send] });
      return;
    }
    await DotBotFunctions.Forecast.weather(message, args);
  }
}