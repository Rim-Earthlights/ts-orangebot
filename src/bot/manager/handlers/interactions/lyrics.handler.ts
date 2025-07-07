import { ActivityType, CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Logger } from '../../../../common/logger.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { JSDOM } from 'jsdom';
import { UsersRepository } from '../../../../model/repository/usersRepository.js';
import { DISCORD_CLIENT } from '../../../../constant/constants.js';

export class LyricsHandler extends BaseInteractionHandler {
  private LYRICS_BASE_URL = 'https://www.uta-net.com/';

  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();
    let query = interaction.options.getString('query');
    if (!query) {
      const userRepository = new UsersRepository();
      const userInfo = await userRepository.getByUid(interaction.user.id);

      if (!userInfo) {
        await interaction.editReply({ content: 'ユーザーが見つかりませんでした' });
        return;
      }
      const presence = DISCORD_CLIENT.guilds.cache
        .get(userInfo?.guild_id ?? '1017341244508225596')
        ?.presences.cache.get(interaction.user.id);

      const activity = presence?.activities.find((a) => a.type === ActivityType.Listening);
      if (!activity || !activity.details) {
        await interaction.editReply({ content: '曲名を指定してください' });
        return;
      }

      query = activity.details;
    }
    const songUrl = await this.searchSong(query);
    if (!songUrl) {
      await interaction.editReply({ content: '曲が見つかりませんでした' });
      return;
    }
    const lyrics = await this.getLyrics(songUrl);
    if (!lyrics) {
      await interaction.editReply({ content: '歌詞が見つかりませんでした' });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${lyrics.title} - ${lyrics.artist}`)
      .setDescription(lyrics.lyrics)
      .setFooter({ text: 'https://www.uta-net.com/' });

    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * 歌詞を取得する
   * @param query 曲のURL
   * @returns 歌詞
   */
  private async getLyrics(url: string): Promise<{ title: string; artist: string; lyrics: string } | null> {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const infoBoard = document.getElementsByClassName('song-infoboard')[0];
    const songInfo = infoBoard.querySelector('div > div > div');

    const title = songInfo?.querySelector('div > .kashi-title')?.textContent;
    const artist = songInfo?.querySelector('div > h3 > a > span')?.textContent;

    const lyrics = document.getElementById('kashi_area');
    if (!lyrics) {
      return null;
    }
    return {
      title: title ?? '',
      artist: artist ?? '',
      lyrics: lyrics.innerHTML.replace(/<br>/g, '\n'),
    };
  }

  /**
   * 曲名で検索して、曲のURLを取得する
   * @param query 検索する曲名
   * @returns 曲のURL
   */
  private async searchSong(query: string): Promise<string | null> {
    const url = `${this.LYRICS_BASE_URL}/search/?keyword=${query}`;
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const songList = document.getElementsByClassName('songlist-table')[0];

    if (!songList) {
      return null;
    }

    const song = songList.querySelector('tbody > tr > td > a');
    const songUrl = song?.getAttribute('href');

    if (!songUrl) {
      return null;
    }
    return `${this.LYRICS_BASE_URL}${songUrl}`;
  }
}
