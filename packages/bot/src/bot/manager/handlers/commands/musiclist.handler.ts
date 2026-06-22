import { EmbedBuilder, Message } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class MusicListHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    if (!args || args.length === 0) {
      await this.handleListPlaylists(message);
      return;
    }

    switch (args[0]) {
      case 'rm':
      case 'rem': {
        await this.handleRemovePlaylist(message, args);
        break;
      }
      case 'reg':
      case 'add': {
        await this.handleAddPlaylist(message, args);
        break;
      }
      case 'loop':
      case 'lp': {
        await this.handleLoopPlaylist(message, args);
        break;
      }
      case 'shuffle':
      case 'sf': {
        await this.handleShufflePlaylist(message, args);
        break;
      }
      default: {
        break;
      }
    }
  }

  private async handleListPlaylists(message: Message): Promise<void> {
    const playlists = await DotBotFunctions.Music.getPlaylist(message.author.id);

    if (playlists.length === 0) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('エラー: ')
        .setDescription('プレイリストが登録されていない');

      message.reply({ content: `見つからなかった…もう一回登録してみて～！`, embeds: [send] });
      return;
    }

    const description = playlists
      .map(
        (p) =>
          `登録名: ${p.name}\n> プレイリスト名: ${p.title} | ループ: ${p.loop ? 'ON' : 'OFF'} | シャッフル: ${
            p.shuffle ? 'ON' : 'OFF'
          }`
      )
      .join('\n');

    const send = new EmbedBuilder().setColor('#00ffff').setTitle('プレイリスト:').setDescription(description);

    message.reply({ content: `プレイリストの一覧だよ！`, embeds: [send] });
  }

  private async handleRemovePlaylist(message: Message, args: string[]): Promise<void> {
    try {
      const name = args[1];
      const deleted = await DotBotFunctions.Music.removePlaylist(message.author.id, name);

      if (!deleted) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('エラー:')
          .setDescription('削除するプレイリスト名を取得できなかった');

        message.reply({
          content: `削除できなかったみたい…もう一度名前を確認してみて！`,
          embeds: [send],
        });
        return;
      }

      const send = new EmbedBuilder().setColor('#00ffff').setTitle('プレイリスト: ').setDescription('削除完了');

      message.reply({ content: `削除できたよ～！`, embeds: [send] });
    } catch (e) {
      const error = e as Error;
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription([error.name, error.message, error.stack].join('\n'));

      message.reply({
        content: `ありゃ、何かで落ちたみたい…？よかったら下のメッセージをりむくんに送ってみてね！`,
        embeds: [send],
      });
      return;
    }
  }

  private async handleAddPlaylist(message: Message, args: string[]): Promise<void> {
    try {
      const name = args[1];
      const url = args[2];

      const result = await DotBotFunctions.Music.registerPlaylist(message.author.id, name, url);

      if (result.status === 'exists') {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`プレイリストが存在している`);
        message.reply({
          content: `もうすでに同じ名前があるみたい……先に消すか別の名前にして！`,
          embeds: [send],
        });
        return;
      }

      if (result.status === 'invalid') {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`プレイリストor動画のURLではない`);
        message.reply({ content: `プレイリストが非公開かも？`, embeds: [send] });
        return;
      }

      const label = result.type === 'playlist' ? 'プレイリスト名' : '動画名';
      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle(`登録`)
        .setDescription(`登録名: ${name}\n${label}: ${result.title}\nURL: ${url}`);
      message.reply({ content: `以下の内容で登録したよ～！`, embeds: [send] });

      return;
    } catch (e) {
      const error = e as Error;
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription([error.name, error.message, error.stack].join('\n'));

      message.reply({
        content: `ありゃ、何かで落ちたみたい…？よかったらりむくんに送ってみてね！`,
        embeds: [send],
      });
      return;
    }
  }

  private async handleLoopPlaylist(message: Message, args: string[]): Promise<void> {
    if (args.length < 3) {
      const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`引数が足りない`);
      message.reply({ content: `ループのON/OFFを指定してね！`, embeds: [send] });
      return;
    }

    const name = args[1];
    const state = args[2].toUpperCase() === 'ON';

    const updated = await DotBotFunctions.Music.setPlaylistLoop(message.author.id, name, state);
    if (!updated) {
      return;
    }

    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`更新`)
      .setDescription(`更新名: ${name}\nループ: ${state ? 'ON' : 'OFF'}`);
    message.reply({ content: `以下の内容で更新したよ～！`, embeds: [send] });
  }

  private async handleShufflePlaylist(message: Message, args: string[]): Promise<void> {
    if (args.length < 3) {
      const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`引数が足りない`);
      message.reply({ content: `シャッフルのON/OFFを指定してね！`, embeds: [send] });
      return;
    }

    const name = args[1];
    const state = args[2].toUpperCase() === 'ON';

    const updated = await DotBotFunctions.Music.setPlaylistShuffle(message.author.id, name, state);
    if (!updated) {
      return;
    }

    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`更新`)
      .setDescription(`更新名: ${name}\nシャッフル: ${state ? 'ON' : 'OFF'}`);
    message.reply({ content: `以下の内容で更新したよ～！`, embeds: [send] });
  }
}
