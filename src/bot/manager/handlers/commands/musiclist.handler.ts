import ytdl from '@distube/ytdl-core';
import { EmbedBuilder, Message } from 'discord.js';
import ytpl from 'ytpl';
import { Logger } from '../../../../common/logger.js';
import { PlaylistRepository } from '../../../../model/repository/playlistRepository.js';
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

      const repository = new PlaylistRepository();
      const p = await repository.get(message.author.id, name);

      if (p) {
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

      const playlistFlag = ytpl.validateID(url);
      const movieFlag = ytdl.validateURL(url);

      if (playlistFlag) {
        const pid = await ytpl.getPlaylistID(url);
        const playlist = await ytpl(pid);

        await repository.save({
          name: name,
          user_id: message.author.id,
          title: playlist.title,
          url: playlist.url,
        });

        const send = new EmbedBuilder()
          .setColor('#ff9900')
          .setTitle(`登録`)
          .setDescription(`登録名: ${name}\nプレイリスト名: ${playlist.title}\nURL: ${url}`);
        message.reply({ content: `以下の内容で登録したよ～！`, embeds: [send] });

        return;
      }

      if (movieFlag) {
        const movie = await ytdl.getInfo(url);

        await repository.save({
          name: name,
          user_id: message.author.id,
          title: movie.videoDetails.title,
          url: movie.videoDetails.video_url,
        });

        const send = new EmbedBuilder()
          .setColor('#ff9900')
          .setTitle(`登録`)
          .setDescription(`登録名: ${name}\n動画名: ${movie.videoDetails.title}\nURL: ${url}`);
        message.reply({ content: `以下の内容で登録したよ～！`, embeds: [send] });

        return;
      }

      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`プレイリストor動画のURLではない`);
      message.reply({ content: `プレイリストが非公開かも？`, embeds: [send] });

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
    const name = args[1];
    const state = args[2].toUpperCase() === 'ON';

    const repository = new PlaylistRepository();
    const p = await repository.get(message.author.id, name);

    if (!p) {
      return;
    }

    await repository.save({ id: p.id, loop: Number(state) });
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`更新`)
      .setDescription(`更新名: ${name}\nループ: ${state ? 'ON' : 'OFF'}`);
    message.reply({ content: `以下の内容で更新したよ～！`, embeds: [send] });
  }

  private async handleShufflePlaylist(message: Message, args: string[]): Promise<void> {
    const name = args[1];
    const state = args[2].toUpperCase() === 'ON';

    const repository = new PlaylistRepository();
    const p = await repository.get(message.author.id, name);

    if (!p) {
      return;
    }

    await repository.save({ id: p.id, shuffle: Number(state) });
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`更新`)
      .setDescription(`更新名: ${name}\nシャッフル: ${state ? 'ON' : 'OFF'}`);
    message.reply({ content: `以下の内容で更新したよ～！`, embeds: [send] });
  }
}