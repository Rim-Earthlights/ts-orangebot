import ytdl from '@distube/ytdl-core';
import { EmbedBuilder, Message, VoiceBasedChannel } from 'discord.js';
import { isEnableFunction } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { functionNames } from '../../../../constant/constants.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { BaseMessageHandler } from '../../message.handler.js';

export class MusicHandler extends BaseMessageHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(message: Message, command: string, args: string[]): Promise<void> {
    switch (command) {
      case 'play':
      case 'pl': {
        await this.handlePlay(message, args);
        break;
      }
      case 'search':
      case 'sc': {
        await this.handleSearch(message, args);
        break;
      }
      case 'interrupt':
      case 'pi': {
        await this.handleInterrupt(message, args);
        break;
      }
      case 'stop':
      case 'st': {
        await this.handleStop(message);
        break;
      }
      case 'rem':
      case 'rm': {
        await this.handleRem(message, args);
        break;
      }
      case 'pause': {
        await this.handlePause(message);
        break;
      }
      case 'q': {
        await this.handleQueue(message);
        break;
      }
      case 'silent':
      case 'si': {
        await this.handleSilent(message);
        break;
      }
    }
  }

  private async handlePlay(message: Message, args: string[]): Promise<void> {
    if (!isEnableFunction(functionNames.YOUTUBE)) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`機能が有効化されていません。`);

      message.reply({ content: `機能が有効化されてないよ！(YOUTUBE)`, embeds: [send] });
      return;
    }

    try {
      if (!args || args.length === 0) {
        const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

        message.reply({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
        return;
      }

      const url = args[0];
      const channel = message.member?.voice.channel;

      if (!channel) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`userのボイスチャンネルが見つからなかった`);

        message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
        return;
      }

      await DotBotFunctions.Music.add(channel, url, message.author.id);
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

  private async handleSearch(message: Message, args: string[]): Promise<void> {
    if (!isEnableFunction(functionNames.YOUTUBE)) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`機能が有効化されていません。`);

      message.reply({ content: `機能が有効化されてないよ！(YOUTUBE)`, embeds: [send] });
      return;
    }

    try {
      if (!args || args.length === 0) {
        const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

        message.reply({ content: `検索する単語を指定してね！`, embeds: [send] });
        return;
      }

      const words = args.join(' ');
      const channel = message.member?.voice.channel;

      if (!channel) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`userのボイスチャンネルが見つからなかった`);

        message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
        return;
      }

      await DotBotFunctions.Music.search(channel, words);
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

  private async handleInterrupt(message: Message, args: string[]): Promise<void> {
    if (!args || args.length === 0) {
      const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

      message.reply({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
      return;
    }

    const channel = message.member?.voice.channel;
    const url = args[0];
    const num = Number(url);

    if (!channel) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`userのボイスチャンネルが見つからなかった`);

      message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
      return;
    }

    if (!Number.isNaN(num)) {
      await DotBotFunctions.Music.interruptIndex(channel, num);
      return;
    }

    if (!ytdl.validateURL(args[0])) {
      const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

      message.reply({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
      return;
    }

    await DotBotFunctions.Music.interruptMusic(channel, url);
  }

  private async handleStop(message: Message): Promise<void> {
    const channel = message.member?.voice.channel;
    if (!channel) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`userのボイスチャンネルが見つからなかった`);

      message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
      return;
    }
    await DotBotFunctions.Music.stopMusic(channel);
  }

  private async handleRem(message: Message, args: string[]): Promise<void> {
    if (!args) {
      return;
    }
    if (args[0] === 'all') {
      await this.handleExterm(message);
      return;
    }
    const num = Number(args[0]);
    if (num === undefined) {
      return;
    }

    const channel = message.member?.voice.channel;
    if (!channel) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`userのボイスチャンネルが見つからなかった`);

      message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
      return;
    }
    await DotBotFunctions.Music.removeId(channel, channel.guild.id, num);
  }

  private async handlePause(message: Message): Promise<void> {
    const gid = message.guild?.id;
    if (!gid) {
      return;
    }
    await DotBotFunctions.Music.pause(message.channel as VoiceBasedChannel);
  }

  private async handleExterm(message: Message): Promise<void> {
    if (!message.guild?.id) {
      return;
    }

    await DotBotFunctions.Music.extermAudioPlayer(message.guild.id, message.channel.id);
  }

  private async handleQueue(message: Message): Promise<void> {
    const channel = message.member?.voice.channel;
    if (!channel) {
      return;
    }
    await DotBotFunctions.Music.showQueue(channel);
  }

  private async handleSilent(message: Message): Promise<void> {
    const channel = message.member?.voice.channel;
    if (!channel) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`userのボイスチャンネルが見つからなかった`);

      message.reply({ content: `ボイスチャンネルに入ってから使って～！`, embeds: [send] });
      return;
    }

    await DotBotFunctions.Music.changeNotify(channel);
  }
}