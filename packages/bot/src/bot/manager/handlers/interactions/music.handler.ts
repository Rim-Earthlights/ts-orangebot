import { CacheType, ChatInputCommandInteraction, EmbedBuilder, GuildMember, VoiceBasedChannel } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { isEnableFunction } from '../../../../common/common.js';
import { functionNames } from '../../../../constant/constants.js';
import * as DotBotFunctions from '../../../dot_function/index.js';
import { extractVideoId } from '../../../request/innertube.js';

/**
 * 音楽再生関連のスラッシュコマンド (/music) のハンドラー
 *
 * 各アダプター (DotBotFunctions.Music) には応答先 (ReplyFn) を渡し、
 * コマンドの実行結果 (キュー追加・設定表示など) は interaction の返信として出す。
 * 一方、再生中に自動で流れる「再生中」通知などはアダプター内部で従来通り
 * ボイスチャンネルへ送信される (interaction トークンの寿命/回数制限のため)。
 */
export class MusicHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'play': {
        await this.handlePlay(interaction);
        break;
      }
      case 'search': {
        await this.handleSearch(interaction);
        break;
      }
      case 'interrupt': {
        await this.handleInterrupt(interaction);
        break;
      }
      case 'stop': {
        await this.handleStop(interaction);
        break;
      }
      case 'remove': {
        await this.handleRemove(interaction);
        break;
      }
      case 'pause': {
        await this.handlePause(interaction);
        break;
      }
      case 'queue': {
        await this.handleQueue(interaction);
        break;
      }
      case 'shuffle': {
        await this.handleShuffle(interaction);
        break;
      }
      case 'silent': {
        await this.handleSilent(interaction);
        break;
      }
      case 'mode': {
        await this.handleMode(interaction);
        break;
      }
      case 'seek': {
        await this.handleSeek(interaction);
        break;
      }
    }
  }

  /**
   * interaction に応答する ReplyFn を作る。
   * 最初の応答は editReply (deferReply 済みのため)、2回目以降は followUp。
   * used() でアダプターが実際に応答を出したかを判定できる
   * (出していなければ呼び出し側で受付確認を返す)。
   */
  private createSink(interaction: ChatInputCommandInteraction<CacheType>): {
    notify: DotBotFunctions.Music.ReplyFn;
    used: () => boolean;
  } {
    let count = 0;
    const notify: DotBotFunctions.Music.ReplyFn = async (payload) => {
      if (count === 0) {
        count += 1;
        return interaction.editReply(payload);
      }
      count += 1;
      return interaction.followUp(payload);
    };
    return { notify, used: () => count > 0 };
  }

  /**
   * 実行ユーザーが参加しているボイスチャンネルを取得する。
   * 取得できない場合は interaction にエラーを返して null を返す。
   */
  private async resolveVoiceChannel(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<VoiceBasedChannel | null> {
    const member = interaction.member instanceof GuildMember ? interaction.member : null;
    const channel = member?.voice.channel ?? null;

    if (!channel) {
      await interaction.editReply({ content: `ボイスチャンネルに入ってから使って～！` });
    }
    return channel;
  }

  /**
   * 機能が有効か確認する。無効なら interaction にエラーを返して false を返す。
   */
  private async checkYoutubeEnabled(interaction: ChatInputCommandInteraction<CacheType>): Promise<boolean> {
    if (!isEnableFunction(functionNames.YOUTUBE)) {
      await interaction.editReply({ content: `機能が有効化されてないよ！(YOUTUBE)` });
      return false;
    }
    return true;
  }

  /**
   * 例外を interaction にエラー表示する
   */
  private async replyError(interaction: ChatInputCommandInteraction<CacheType>, e: unknown): Promise<void> {
    const error = e as Error;
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`エラー`)
      .setDescription([error.name, error.message, error.stack].join('\n'));

    await interaction.editReply({
      content: `ありゃ、何かで落ちたみたい…？よかったらりむくんに送ってみてね！`,
      embeds: [send],
    });
  }

  private async handlePlay(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    if (!(await this.checkYoutubeEnabled(interaction))) {
      return;
    }

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    const url = interaction.options.getString('url', true);
    const sink = this.createSink(interaction);

    try {
      await DotBotFunctions.Music.add(channel, url, interaction.user.id, undefined, undefined, sink.notify);
      if (!sink.used()) {
        await interaction.editReply({ content: `再生を開始したよ～！` });
      }
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleSearch(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    if (!(await this.checkYoutubeEnabled(interaction))) {
      return;
    }

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    const word = interaction.options.getString('word', true);
    const sink = this.createSink(interaction);

    try {
      await DotBotFunctions.Music.search(channel, word, sink.notify);
      if (!sink.used()) {
        await interaction.editReply({ content: `「${word}」で検索して再生を開始したよ～！` });
      }
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleInterrupt(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    const target = interaction.options.getString('target', true);
    const num = Number(target);
    const sink = this.createSink(interaction);

    try {
      if (!Number.isNaN(num)) {
        await DotBotFunctions.Music.interruptIndex(channel, num, sink.notify);
        if (!sink.used()) {
          await interaction.editReply({ content: `${num}番のキューが見つからなかった…！` });
        }
        return;
      }

      if (!extractVideoId(target)) {
        await interaction.editReply({ content: `YoutubeのURLを指定して～！` });
        return;
      }

      await DotBotFunctions.Music.interruptMusic(channel, target, sink.notify);
      if (!sink.used()) {
        await interaction.editReply({ content: `割込予約したよ～！` });
      }
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleStop(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    try {
      await DotBotFunctions.Music.stopMusic(channel);
      await interaction.editReply({ content: `停止したよ～！` });
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleRemove(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    const num = interaction.options.getInteger('num') ?? undefined;
    const sink = this.createSink(interaction);

    try {
      if (num === undefined) {
        await DotBotFunctions.Music.extermAudioPlayer(channel.guild.id, channel.id);
        await interaction.editReply({ content: `キューを全部消したよ～！` });
        return;
      }

      await DotBotFunctions.Music.removeId(channel, channel.guild.id, num, sink.notify);
      if (!sink.used()) {
        await interaction.editReply({ content: `削除する曲が見つからなかった…！` });
      }
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handlePause(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    try {
      await DotBotFunctions.Music.pause(channel);
      await interaction.editReply({ content: `一時停止/再開したよ～！` });
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleQueue(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    const sink = this.createSink(interaction);

    try {
      await DotBotFunctions.Music.showQueue(channel, sink.notify);
      if (!sink.used()) {
        await interaction.editReply({ content: `再生中の曲がないみたい？` });
      }
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleShuffle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    const sink = this.createSink(interaction);

    try {
      await DotBotFunctions.Music.shuffleMusic(channel, sink.notify);
      if (!sink.used()) {
        await interaction.editReply({ content: `シャッフルしたよ～！` });
      }
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleSilent(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    const sink = this.createSink(interaction);

    try {
      await DotBotFunctions.Music.changeNotify(channel, sink.notify);
      if (!sink.used()) {
        await interaction.editReply({ content: `サイレントモードを切り替えたよ～！` });
      }
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleMode(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    const name = interaction.options.getString('name') ?? undefined;
    const sink = this.createSink(interaction);

    try {
      if (!name) {
        await DotBotFunctions.Music.getPlayerInfo(channel, sink.notify);
      } else {
        await DotBotFunctions.Music.editPlayerInfo(channel, name, sink.notify);
      }
      if (!sink.used()) {
        await interaction.editReply({ content: `再生設定がまだないみたい？再生してから試してね！` });
      }
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleSeek(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const channel = await this.resolveVoiceChannel(interaction);
    if (!channel) {
      return;
    }

    const time = interaction.options.getString('time', true);

    let seek = 0;
    if (time.includes(':')) {
      const parts = time.split(':');
      const min = Number(parts[0]);
      const sec = Number(parts[1]);
      seek = min * 60 + sec;
    } else {
      seek = Number(time);
    }

    if (Number.isNaN(seek)) {
      await interaction.editReply({ content: `時間は秒数 or mm:ss 形式で指定してね！` });
      return;
    }

    const sink = this.createSink(interaction);

    try {
      await DotBotFunctions.Music.seek(channel, seek, sink.notify);
      if (!sink.used()) {
        await interaction.editReply({ content: `${seek}秒の位置に移動したよ～！` });
      }
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }
}
