import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import * as DotBotFunctions from '../../../dot_function/index.js';

/**
 * プレイリスト管理のスラッシュコマンド (/playlist) のハンドラー
 * プレイリストはユーザー単位のため interaction に直接 Embed を返す。
 */
export class PlaylistHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'list': {
        await this.handleList(interaction);
        break;
      }
      case 'add': {
        await this.handleAdd(interaction);
        break;
      }
      case 'remove': {
        await this.handleRemove(interaction);
        break;
      }
      case 'loop': {
        await this.handleLoop(interaction);
        break;
      }
      case 'shuffle': {
        await this.handleShuffle(interaction);
        break;
      }
    }
  }

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

  private async handleList(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    try {
      const playlists = await DotBotFunctions.Music.getPlaylist(interaction.user.id);

      if (playlists.length === 0) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('エラー: ')
          .setDescription('プレイリストが登録されていない');

        await interaction.editReply({ content: `見つからなかった…もう一回登録してみて～！`, embeds: [send] });
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

      await interaction.editReply({ content: `プレイリストの一覧だよ！`, embeds: [send] });
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleAdd(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const name = interaction.options.getString('name', true);
    const url = interaction.options.getString('url', true);

    try {
      const result = await DotBotFunctions.Music.registerPlaylist(interaction.user.id, name, url);

      if (result.status === 'exists') {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`プレイリストが存在している`);
        await interaction.editReply({
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
        await interaction.editReply({ content: `プレイリストが非公開かも？`, embeds: [send] });
        return;
      }

      const label = result.type === 'playlist' ? 'プレイリスト名' : '動画名';
      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle(`登録`)
        .setDescription(`登録名: ${name}\n${label}: ${result.title}\nURL: ${url}`);
      await interaction.editReply({ content: `以下の内容で登録したよ～！`, embeds: [send] });
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleRemove(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const name = interaction.options.getString('name', true);

    try {
      const deleted = await DotBotFunctions.Music.removePlaylist(interaction.user.id, name);

      if (!deleted) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('エラー:')
          .setDescription('削除するプレイリスト名を取得できなかった');

        await interaction.editReply({
          content: `削除できなかったみたい…もう一度名前を確認してみて！`,
          embeds: [send],
        });
        return;
      }

      const send = new EmbedBuilder().setColor('#00ffff').setTitle('プレイリスト: ').setDescription('削除完了');
      await interaction.editReply({ content: `削除できたよ～！`, embeds: [send] });
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleLoop(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const name = interaction.options.getString('name', true);
    const state = interaction.options.getBoolean('enabled', true);

    try {
      const updated = await DotBotFunctions.Music.setPlaylistLoop(interaction.user.id, name, state);
      if (!updated) {
        await interaction.editReply({ content: `その登録名のプレイリストが見つからなかった…！` });
        return;
      }

      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle(`更新`)
        .setDescription(`更新名: ${name}\nループ: ${state ? 'ON' : 'OFF'}`);
      await interaction.editReply({ content: `以下の内容で更新したよ～！`, embeds: [send] });
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }

  private async handleShuffle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const name = interaction.options.getString('name', true);
    const state = interaction.options.getBoolean('enabled', true);

    try {
      const updated = await DotBotFunctions.Music.setPlaylistShuffle(interaction.user.id, name, state);
      if (!updated) {
        await interaction.editReply({ content: `その登録名のプレイリストが見つからなかった…！` });
        return;
      }

      const send = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle(`更新`)
        .setDescription(`更新名: ${name}\nシャッフル: ${state ? 'ON' : 'OFF'}`);
      await interaction.editReply({ content: `以下の内容で更新したよ～！`, embeds: [send] });
    } catch (e) {
      await this.replyError(interaction, e);
    }
  }
}
