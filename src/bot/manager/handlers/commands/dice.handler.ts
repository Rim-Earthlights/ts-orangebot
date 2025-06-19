import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import * as DiceService from '../../../services/dice.service.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class DiceHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'dice': {
        await this.handleDiceRoll(message, args);
        break;
      }
      case 'dall': {
        await this.handleDiceAll(message);
        break;
      }
      case 'celo': {
        await this.handleCelo(message);
        break;
      }
      case 'celovs': {
        await this.handleCeloVs(message);
        break;
      }
      case 'choose':
      case 'choice':
      case 'ch': {
        await this.handleChoose(message, args);
        break;
      }
    }
  }

  private async handleDiceRoll(message: Message, args: string[]): Promise<void> {
    if (args == undefined || args.length < 2) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('失敗')
        .setDescription('[.dice 5 6] 6面体ダイスを5回振る のように指定してね');

      message.reply({ content: `どう振っていいのかわかんない！！`, embeds: [send] });
      return;
    }

    const diceNum = Number(args[0]);
    const diceMax = Number(args[1]);

    const result = DiceService.rollDice(diceNum, diceMax);

    if ('type' in result) {
      // エラーハンドリング
      let content: string;
      switch (result.type) {
        case 'INVALID_NUMBER':
          content = 'いじわる！きらい！';
          break;
        case 'TOO_MANY_DICE':
          content = '一度にそんなに振れないよ～……';
          break;
        case 'MESSAGE_TOO_LONG':
          content = '振らせすぎ！もうちょっと少なくして～！';
          break;
        default:
          content = 'エラーが発生しました';
          break;
      }

      const send = new EmbedBuilder().setColor('#ff0000').setTitle('失敗').setDescription(result.message);

      message.reply({ content, embeds: [send] });
      return;
    }

    // 成功時の処理
    const diceResult = result.results.join(', ');
    const send = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('サイコロ振ったよ～！')
      .setDescription(diceResult)
      .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/dice.jpg')
      .addFields({
        name: '足した結果',
        value: result.sum.toString(),
      })
      .addFields({
        name: '最大値',
        value: result.max.toString(),
      })
      .addFields({
        name: '最小値',
        value: result.min.toString(),
      })
      .addFields({
        name: '平均値',
        value: result.average.toFixed(2).toString(),
      });

    message.reply({ content: `${diceMax}面ダイスを${diceNum}個ね！まかせて！`, embeds: [send] });
  }

  private async handleDiceAll(message: Message): Promise<void> {
    if (message.channel.type === ChannelType.GuildVoice || message.channel.type === ChannelType.GuildStageVoice) {
      const memberNames: string[] = [];
      message.channel.members.map((m) => {
        memberNames.push(m.displayName);
      });

      const result = DiceService.rollAllDice(memberNames);

      const send = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`結果:`)
        .setDescription(
          result.participants
            .map((p) => {
              return `${p.displayName}: ${p.result}`;
            })
            .join('\n')
        )
        .setThumbnail('https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/dice.jpg');

      message.reply({ embeds: [send] });
    } else {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('失敗')
        .setDescription('ユーザーリストが取得できない');

      message.reply({ content: `ボイスチャンネルで実行してね！`, embeds: [send] });
      return;
    }
  }

  private async handleCelo(message: Message): Promise<void> {
    await DotBotFunctions.Dice.celo(message);
  }

  private async handleCeloVs(message: Message): Promise<void> {
    await DotBotFunctions.Dice.celovs(message);
  }

  private async handleChoose(message: Message, args: string[]): Promise<void> {
    if (args.length <= 0) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`選択肢を入力してください`);

      message.reply({ embeds: [send] });
      return;
    }

    const item = DotBotFunctions.Dice.choose(args);
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`選択結果: ${item}`)
      .setDescription(`選択肢: ${args.join(', ')}`);

    message.reply({ embeds: [send] });
  }
}
