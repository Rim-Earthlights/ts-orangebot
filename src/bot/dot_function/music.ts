import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import { EmbedBuilder, VoiceBasedChannel, VoiceChannel } from 'discord.js';
import pldl, { SpotifyAlbum, SpotifyTrack } from 'play-dl';
import { getRndArray } from '../../common/common.js';
import { Logger } from '../../common/logger.js';
import { CONFIG, YT_AGENT } from '../../config/config.js';
import { Music, PlayerData } from '../../constant/music/music.js';
import { Playlist } from '../../model/models/index.js';
import { MusicInfoRepository } from '../../model/repository/musicInfoRepository.js';
import { MusicRepository } from '../../model/repository/musicRepository.js';
import { PlaylistRepository } from '../../model/repository/playlistRepository.js';
import { LogLevel } from '../../type/types.js';
import { getPlaylistItems } from '../request/youtube.js';

/**
 * キューに音楽を追加する
 * @param channel 送信するchannel
 * @param url 動画url
 * @returns
 */
export async function add(
  channel: VoiceBasedChannel,
  url: string,
  userId: string,
  loop?: boolean,
  shuffle?: boolean
): Promise<boolean> {
  // false | "so_playlist" | "so_track" | "sp_track" | "sp_album" | "sp_playlist" | "dz_track" | "dz_playlist" | "dz_album" | "yt_video" | "yt_playlist" | "search"
  if (url.includes('intl-ja/')) {
    url = url.replace('intl-ja/', '');
  }

  const musicFlag = await pldl.validate(url);

  switch (musicFlag) {
    case 'yt_video':
    case 'yt_playlist': {
      const videoFlag = !url.includes('playlist');

      if (videoFlag) {
        await addYoutubeMusic(channel, 'video', url, false, loop, shuffle);
      } else {
        await addYoutubeMusic(channel, 'playlist', url, false, loop, shuffle);
      }

      return true;
    }
    case 'sp_track':
    case 'sp_album': {
      await addSpotifyMusic(channel, url, musicFlag);
      return true;
    }
    default: {
      const playlistRepository = new PlaylistRepository();
      const playlist = await playlistRepository.get(userId, url);
      if (playlist) {
        await add(channel, playlist.url, userId, Boolean(playlist.loop), Boolean(playlist.shuffle));
        return true;
      }
      const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

      (channel as VoiceChannel).send({ content: `YoutubeかSpotifyのURLを指定して～！`, embeds: [send] });
      return false;
    }
  }
}

/**
 * 音楽を検索してキューに追加する
 * @param channel 送信するchannel
 * @param word 検索語句
 * @returns
 */
export async function search(channel: VoiceBasedChannel, word: string): Promise<boolean> {
  const searched = await pldl.search(word, { limit: 5 });

  const isMv = searched.find((s) => s.title?.match(/((O|o)fficial|MV|mv|(M|m)usic)/) !== null);
  if (isMv) {
    await addYoutubeMusic(channel, 'video', isMv.url, false, undefined, undefined);
    return true;
  }

  const sorted = searched.sort(function (a, b) {
    return b.views - a.views;
  });

  await addYoutubeMusic(channel, 'video', sorted[0].url, false, undefined, undefined);
  return true;
}

/**
 * Spotifyの音楽情報を取得し、Youtubeで検索してキューに追加する
 * @param channel
 * @param url
 * @returns
 */
export async function addSpotifyMusic(
  channel: VoiceBasedChannel,
  url: string,
  musicFlag: 'sp_track' | 'sp_album'
): Promise<boolean> {
  if (pldl.is_expired()) {
    console.log('token expire');
    await pldl.refreshToken();
  }

  if (musicFlag === 'sp_album') {
    const album = (await pldl.spotify(url)) as SpotifyAlbum;
    const tracks = await album.all_tracks();

    tracks.map(async (track) => {
      await search(channel, `${track.name} ${track.artists.map((a) => a.name).join(' ')}`);
      setTimeout(() => null, 100);
    });

    return true;
  }

  const sp = (await pldl.spotify(url)) as SpotifyTrack;
  await search(channel, `${sp.name} ${sp.artists.map((a) => a.name).join(' ')}`);

  return true;
}

/**
 * Youtubeの音楽情報を取得し、キューに追加する
 * @param channel
 * @param type
 * @param url url or movie id
 * @param interrupt
 * @param loop
 * @param shuffle
 * @returns
 */
export async function addYoutubeMusic(
  channel: VoiceBasedChannel,
  type: 'video' | 'playlist',
  url: string,
  interrupt?: boolean,
  loop?: boolean,
  shuffle?: boolean
): Promise<boolean> {
  const repository = new MusicRepository();
  const p = await updateAudioPlayer(channel);
  const status = p.player.state.status;

  if (type === 'video') {
    const ytinfo = await pldl.video_info(url);

    await repository.add(
      channel.guild.id,
      channel.id,
      {
        guild_id: channel.guild.id,
        channel_id: channel.id,
        title: ytinfo.video_details.title,
        url: ytinfo.video_details.url,
        thumbnail: ytinfo.video_details.thumbnails[0].url,
      },
      !!interrupt
    );
    if (interrupt) {
      return true;
    }

    const musics = await repository.getQueue(channel.guild.id, channel.id);

    if (status === AudioPlayerStatus.Playing) {
      const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');
      const addMusic = musics.find((m) => m.url === ytinfo.video_details.url);

      if (description.length >= 4000) {
        const sliced = musics.slice(0, 20);
        const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

        const send = new EmbedBuilder()
          .setColor('#cc66cc')
          .setAuthor({ name: `追加: (${addMusic?.music_id}) ${ytinfo.video_details.title}` })
          .setTitle('キュー(先頭の20曲のみ表示しています): ')
          .setDescription(description)
          .setThumbnail(ytinfo.video_details.thumbnails[0].url);

        (channel as VoiceChannel).send({ embeds: [send] });
        return true;
      }

      const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setAuthor({ name: `追加: (${addMusic?.music_id}) ${ytinfo.video_details.title}` })
        .setTitle(`キュー(全${musics.length}曲): `)
        .setDescription(description ? description : 'none')
        .setThumbnail(ytinfo.video_details.thumbnails[0].url);

      (channel as VoiceChannel).send({ embeds: [send] });
      return true;
    }
    await initPlayerInfo(channel, !!loop, !!shuffle);
    await playMusic(channel);
    return true;
  }

  if (type === 'playlist') {
    const pid = new URL(url).searchParams.get('list') ?? '';

    try {
      const pm = await getPlaylistItems(pid);

      await repository.addRange(channel.guild.id, channel.id, pm.playlists, 'youtube');

      const musics = await repository.getQueue(channel.guild.id, channel.id);

      if (status === AudioPlayerStatus.Playing) {
        const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

        if (description.length >= 4000) {
          const sliced = musics.slice(0, 20);
          const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

          const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setAuthor({ name: `追加: ${pm.title}` })
            .setTitle('キュー(先頭の20曲のみ表示しています): ')
            .setDescription(description);

          (channel as VoiceChannel).send({ embeds: [send] });
          return true;
        }

        const send = new EmbedBuilder()
          .setColor('#cc66cc')
          .setAuthor({ name: `追加: ${pm.title}` })
          .setTitle(`キュー(全${musics.length}曲): `)
          .setDescription(description ? description : 'none');

        (channel as VoiceChannel).send({ embeds: [send] });
        return true;
      }
      await initPlayerInfo(channel, !!loop, !!shuffle);
      await playMusic(channel);
      return true;
    } catch (e) {
      await Logger.put({
        guild_id: channel.guild?.id,
        channel_id: channel.id,
        user_id: undefined,
        level: LogLevel.ERROR,
        event: 'command|music-add',
        message: [JSON.stringify(e)],
      });
      const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle('エラー:')
        .setDescription('非公開のプレイリストを読み込んだ');

      (channel as VoiceChannel).send({
        content: `非公開のプレイリストみたい、公開か限定公開にして～！`,
        embeds: [send],
      });
      return false;
    }
  }
  return false;
}

/**
 * プレイヤーの再生設定を取得する
 * @param channel
 * @returns
 */
export async function getPlayerInfo(channel: VoiceBasedChannel): Promise<void> {
  const repository = new MusicInfoRepository();
  const info = await repository.get(channel.guild.id, channel.id);

  if (!info) {
    return;
  }

  const description = [
    `サイレント: ${info.silent === 0 ? '無効' : '有効'}`,
    `ループ: ${info.is_loop === 0 ? '無効' : '有効'}`,
    `シャッフル: ${info.is_shuffle === 0 ? '無効' : '有効'}`,
  ].join('\n');

  const send = new EmbedBuilder().setColor('#cc66cc').setTitle(`再生設定: `).setDescription(description);
  (channel as VoiceChannel).send({
    embeds: [send],
  });
}

/**
 * プレイヤーの再生設定を変更する
 * @param channel
 * @param name
 * @returns
 */
export async function editPlayerInfo(channel: VoiceBasedChannel, name: string): Promise<void> {
  const repository = new MusicInfoRepository();
  const info = await repository.get(channel.guild.id, channel.id);

  if (!info) {
    return;
  }

  switch (name) {
    case 'sf': {
      await repository.save({
        guild_id: channel.guild.id,
        channel_id: channel.id,
        is_shuffle: info.is_shuffle === 0 ? 1 : 0,
      });
      const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle(`再生設定の変更: `)
        .setDescription(`シャッフル: ${info.is_shuffle === 0 ? '有効' : '無効'}`);
      (channel as VoiceChannel).send({
        embeds: [send],
      });
      break;
    }
    case 'lp': {
      await repository.save({
        guild_id: channel.guild.id,
        channel_id: channel.id,
        is_loop: info.is_loop === 0 ? 1 : 0,
      });
      const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle(`再生設定の変更: `)
        .setDescription(`ループ: ${info.is_loop === 0 ? '有効' : '無効'}`);
      (channel as VoiceChannel).send({
        embeds: [send],
      });
      break;
    }
    default: {
      break;
    }
  }
}

/**
 * プレイヤーの再生設定を初期化する
 * @param channel
 * @param loop
 * @param shuffle
 * @returns
 */
export async function initPlayerInfo(channel: VoiceBasedChannel, loop?: boolean, shuffle?: boolean): Promise<void> {
  const repository = new MusicInfoRepository();
  const info = await repository.get(channel.guild.id, channel.id);

  if (!info) {
    if (loop) {
      await repository.save({ guild_id: channel.guild.id, channel_id: channel.id, is_loop: 1 });
    } else {
      await repository.save({ guild_id: channel.guild.id, channel_id: channel.id, is_loop: 0 });
    }

    if (shuffle) {
      await repository.save({ guild_id: channel.guild.id, channel_id: channel.id, is_shuffle: 1 });
      await shuffleMusic(channel);
    } else {
      await repository.save({ guild_id: channel.guild.id, channel_id: channel.id, is_shuffle: 0 });
    }
  } else {
    if (info.is_loop) {
      await resetAllPlayState(channel.guild.id, channel.id);
    }
    if (info.is_shuffle) {
      await shuffleMusic(channel);
    }
  }

  return;
}

/**
 * 割込予約を行う
 * @param channel 送信するchannel
 * @param url 動画url
 * @returns
 */
export async function interruptMusic(channel: VoiceBasedChannel, url: string): Promise<boolean> {
  // false | "so_playlist" | "so_track" | "sp_track" | "sp_album" | "sp_playlist" | "dz_track" | "dz_playlist" | "dz_album" | "yt_video" | "yt_playlist" | "search"
  const musicFlag = await pldl.validate(url);
  const repository = new MusicRepository();

  switch (musicFlag) {
    case 'yt_video':
    case 'yt_playlist': {
      const videoFlag = !url.includes('playlist');

      if (videoFlag) {
        const m = addYoutubeMusic(channel, 'video', url, true);

        const ytinfo = await pldl.video_info(url);
        const musics = await repository.getQueue(channel.guild.id, channel.id);
        const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

        if (description.length >= 4000) {
          const sliced = musics.slice(0, 20);
          const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

          const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setAuthor({ name: `割込: ${ytinfo.video_details.title}` })
            .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
            .setDescription(description);

          (channel as VoiceChannel).send({ embeds: [send] });
        } else {
          const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setAuthor({ name: `割込: ${ytinfo.video_details.title}` })
            .setTitle(`キュー(全${musics.length}曲): `)
            .setDescription(description ? description : 'none');
          (channel as VoiceChannel).send({ embeds: [send] });
        }

        await m;
      }
      break;
    }
    case 'sp_track': {
      const s = addSpotifyMusic(channel, url, musicFlag);

      const sp = await pldl.spotify(url);
      const musics = await repository.getQueue(channel.guild.id, channel.id);
      const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

      if (description.length >= 4000) {
        const sliced = musics.slice(0, 20);
        const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

        const send = new EmbedBuilder()
          .setColor('#cc66cc')
          .setAuthor({ name: `割込: ${sp.name}` })
          .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
          .setDescription(description);

        (channel as VoiceChannel).send({ embeds: [send] });
      } else {
        const send = new EmbedBuilder()
          .setColor('#cc66cc')
          .setAuthor({ name: `割込: ${sp.name}` })
          .setTitle(`キュー(全${musics.length}曲): `)
          .setDescription(description ? description : 'none');
        (channel as VoiceChannel).send({ embeds: [send] });
      }

      await s;
      break;
    }
    default: {
      return false;
    }
  }
  return true;
}

/**
 * 指定した予約番号を一番上に持ち上げる
 * @param channel 送信するchannel
 * @param index music_id
 * @returns
 */
export async function interruptIndex(channel: VoiceBasedChannel, index: number): Promise<boolean> {
  const repository = new MusicRepository();
  const musics = await repository.getQueue(channel.guildId, channel.id);
  const music = musics.find((m) => m.music_id === index);

  if (!music) {
    return false;
  }

  const result = await repository.add(
    channel.guild.id,
    channel.id,
    {
      guild_id: channel.guild.id,
      channel_id: channel.id,
      title: music.title,
      url: music.url,
      thumbnail: music.thumbnail,
    },
    true
  );

  await repository.remove(channel.guild.id, channel.id, music.music_id);

  const newMusics = await repository.getQueue(channel.guild.id, channel.id);

  const description = newMusics.map((m) => m.music_id + ': ' + m.title).join('\n');

  if (description.length >= 4000) {
    const sliced = newMusics.slice(0, 20);
    const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: `割込: ${music.title}` })
      .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
      .setDescription(description)
      .setThumbnail(music.thumbnail);

    (channel as VoiceChannel).send({ embeds: [send] });
  } else {
    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: `割込: ${music.title}` })
      .setTitle(`キュー(全${musics.length}曲): `)
      .setDescription(description ? description : 'none')
      .setThumbnail(music.thumbnail);

    (channel as VoiceChannel).send({ embeds: [send] });
  }

  return result;
}

/**
 * キューから除外する
 * @param gid guild.id
 * @param musicId music_id
 * @returns
 */
export async function remove(gid: string, cid: string, musicId?: number): Promise<boolean> {
  const repository = new MusicRepository();
  return await repository.remove(gid, cid, musicId);
}

/**
 * キューから指定予約番号を除外する
 * @param channel 送信するchannel
 * @param gid guild.id
 * @param musicId music_id
 */
export async function removeId(channel: VoiceBasedChannel, gid: string, musicId: number): Promise<void> {
  const repository = new MusicRepository();
  const musics = await repository.getQueue(gid, channel.id);

  if (musics.length <= 0) {
    return;
  }

  await repository.remove(gid, channel.id, musicId);

  const description = musics
    .filter((m) => m.music_id !== musicId)
    .map((m) => m.music_id + ': ' + m.title)
    .join('\n');

  if (description.length >= 4000) {
    const sliced = musics.slice(0, 20);
    const description = sliced
      .filter((m) => m.music_id !== musicId)
      .map((m) => m.music_id + ': ' + m.title)
      .join('\n');

    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: `削除: ${musics.find((m) => m.music_id === musicId)?.title}` })
      .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
      .setDescription(description);

    (channel as VoiceChannel).send({
      embeds: [send],
    });
  } else {
    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: `削除: ${musics.find((m) => m.music_id === musicId)?.title}` })
      .setTitle(`キュー(全${musics.length}曲): `)
      .setDescription(description ? description : 'none');

    (channel as VoiceChannel).send({
      embeds: [send],
    });
  }
}

/**
 * 音楽をキューから取り出して再生する
 * @param channel 送信するchannel
 * @returns
 */
export async function playMusic(channel: VoiceBasedChannel) {
  const repo_music = new MusicRepository();
  const repo_info = new MusicInfoRepository();

  const musics = await repo_music.getQueue(channel.guild.id, channel.id);
  const info = await repo_info.get(channel.guild.id, channel.id);

  if (musics.length <= 0) {
    if (info?.is_loop === 1) {
      await initPlayerInfo(channel);
      await playMusic(channel);
      return;
    }
    await stopMusic(channel);
    return;
  }

  const playing = musics[0];
  musics.shift();
  await updatePlayState(playing.guild_id, channel.id, playing.music_id, true);
  await repo_info.save({
    guild_id: playing.guild_id,
    channel_id: playing.channel_id,
    title: playing.title,
    url: playing.url,
    thumbnail: playing.thumbnail,
  });
  try {
    const p = await updateAudioPlayer(channel);

    const stream = ytdl(playing.url, { filter: 'audioonly', highWaterMark: 1 << 25, agent: YT_AGENT });
    const resource = createAudioResource(stream);

    if (info?.silent === 0) {
      const slicedMusics = musics.slice(0, 4);
      const description = slicedMusics.map((m) => m.music_id + ': ' + m.title).join('\n');
      const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setAuthor({ name: `再生中の音楽情報/ 全${musics.length + 1}曲` })
        .setTitle(playing.title)
        .setURL(playing.url)
        .setDescription(description ? description : 'none')
        .setThumbnail(playing.thumbnail)
        .addFields({
          name: '再生キュー',
          value: `${CONFIG.COMMON.HOST_URL + '/music?gid=' + channel.guild.id + '&cid=' + channel.id}`,
        });
      (channel as VoiceChannel).send({ embeds: [send] });
    }
    p.player.play(resource);

    await entersState(p.player, AudioPlayerStatus.Playing, 10 * 1000);
    await entersState(p.player, AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);
  } catch (e) {
    const err = e as Error;
    await Logger.put({
      guild_id: channel.guild?.id,
      channel_id: channel.id,
      user_id: undefined,
      level: LogLevel.ERROR,
      event: 'command|music-play',
      message: [JSON.stringify(err.message)],
    });
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setAuthor({ name: `音楽の取得に失敗した` })
      .setTitle(playing.title)
      .setURL(playing.url)
      .setDescription(JSON.stringify(err.message))
      .addFields({
        name: '再生キュー',
        value: `${CONFIG.COMMON.HOST_URL + '/music?gid=' + channel.guild.id + '&cid=' + channel.id}`,
      });
    (channel as VoiceChannel).send({ embeds: [send] });
  }

  await playMusic(channel);
}

/**
 * 音楽を停止する
 * @param channel 送信するchannel
 */
export async function stopMusic(channel: VoiceBasedChannel) {
  const p = await updateAudioPlayer(channel);

  const musicRepository = new MusicRepository();
  const musics = await musicRepository.getQueue(channel.guild.id, channel.id);

  const infoRepository = new MusicInfoRepository();
  const info = await infoRepository.get(channel.guild.id, channel.id);

  if (!info || (musics.length <= 0 && info.is_loop === 0)) {
    await infoRepository.remove(channel.guild.id, channel.id);

    (channel as VoiceChannel).send({ content: '全ての曲の再生が終わったよ！またね～！' });
    await removeAudioPlayer(channel.guild.id, channel.id);
    await remove(channel.guild.id, channel.id);
    const connection = getVoiceConnection(channel.guild.id);
    connection?.destroy();
    return;
  }
  p.player.stop();
}

/**
 * 音楽を強制停止し、キューを全て削除する
 * @param gid guild.id
 * @returns
 */
export async function extermAudioPlayer(gid: string, cid: string): Promise<boolean> {
  await remove(gid, cid);
  await removeAudioPlayer(gid, cid);
  const infoRepository = new MusicInfoRepository();
  await infoRepository.remove(gid, cid);

  const connection = getVoiceConnection(gid);
  try {
    if (connection) {
      connection.destroy();
    }
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 全曲をシャッフルする
 * @param gid guild.id
 * @returns
 */
export async function shuffleMusic(channel: VoiceBasedChannel): Promise<boolean> {
  const repository = new MusicRepository();
  const musics = await repository.getAll(channel.guild.id, channel.id);

  const length = musics.length;
  if (length <= 1) {
    return true;
  }
  const rnd = getRndArray(musics.length);

  for (let i = 0; i < length; i++) {
    musics[i].music_id = rnd[i];
  }

  const shuffled = await repository.saveAll(channel.guild.id, channel.id, musics);
  shuffled.sort((a, b) => a.music_id - b.music_id);

  const description = shuffled.map((m) => m.music_id + ': ' + m.title).join('\n');

  if (description.length >= 4000) {
    const sliced = shuffled.slice(0, 20);
    const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: 'シャッフル完了' })
      .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
      .setDescription(description);

    (channel as VoiceChannel).send({ embeds: [send] });
  } else {
    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: 'シャッフル完了' })
      .setTitle(`キュー(全${musics.length}曲): `)
      .setDescription(description ? description : 'none');
    (channel as VoiceChannel).send({ embeds: [send] });
  }
  return true;
}

/**
 * 音楽の再生状態を更新する
 * @param gid
 * @param musicId
 * @param state
 */
export async function updatePlayState(gid: string, cid: string, musicId: number, state: boolean) {
  const repository = new MusicRepository();
  await repository.updatePlayState(gid, cid, musicId, state);
}

/**
 * 全ての音楽の再生状態をリセットする
 * @param gid
 */
export async function resetAllPlayState(gid: string, cid: string) {
  const repository = new MusicRepository();
  await repository.resetPlayState(gid, cid);
}

/**
 * 音楽を一時停止/再開する
 * @param channel
 */
export async function pause(channel: VoiceBasedChannel): Promise<void> {
  const p = await updateAudioPlayer(channel);
  await Logger.put({
    guild_id: channel.guild?.id,
    channel_id: channel.id,
    user_id: undefined,
    level: LogLevel.INFO,
    event: 'command|music-pause',
    message: [p.player.state.status],
  });

  if (p.player.state.status === AudioPlayerStatus.Paused) {
    p.player.unpause();
  }
  if (p.player.state.status === AudioPlayerStatus.Playing) {
    p.player.pause();
  }
}

/**
 * 現在の予約状況を表示する
 * @param channel 送信するチャンネル
 * @returns
 */
export async function showQueue(channel: VoiceBasedChannel): Promise<void> {
  const repository = new MusicRepository();
  const infoRepository = new MusicInfoRepository();
  const musics = await repository.getQueue(channel.guild.id, channel.id);
  const info = await infoRepository.get(channel.guild.id, channel.id);

  if (!info) {
    return;
  }

  if (musics.length > 0) {
    const slicedMusics = musics.slice(0, 4);
    const description = slicedMusics.map((m) => m.music_id + ': ' + m.title).join('\n');
    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: `再生中の音楽情報/ 全${musics.length + 1}曲` })
      .setTitle(info.title)
      .setURL(info.url)
      .setDescription(description)
      .setThumbnail(info.thumbnail)
      .addFields({
        name: '再生キュー',
        value: `${CONFIG.COMMON.HOST_URL + '/music?gid=' + channel.guild.id + '&cid=' + channel.id}`,
      });
    (channel as VoiceChannel).send({ embeds: [send] });
  } else {
    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: '再生中の音楽情報/ 全1曲' })
      .setTitle(info.title)
      .setURL(info.url)
      .setThumbnail(info.thumbnail)
      .addFields({
        name: '再生キュー',
        value: `${CONFIG.COMMON.HOST_URL + '/music?gid=' + channel.guild.id + '&cid=' + channel.id}`,
      });
    (channel as VoiceChannel).send({ embeds: [send] });
  }
  return;
}

/**
 * 全てのプレイリストを取得する
 * @param userId
 * @returns
 */
export async function getPlaylist(userId: string): Promise<Playlist[]> {
  const repository = new PlaylistRepository();
  return await repository.getAll(userId);
}

/**
 * プレイリストを削除する
 * @param userId
 * @param name
 * @returns
 */
export async function removePlaylist(userId: string, name: string): Promise<boolean> {
  const repository = new PlaylistRepository();
  return await repository.remove(userId, name);
}

/**
 * 音楽の通知状態を変更する
 * @param channel
 * @returns
 */
export async function changeNotify(channel: VoiceBasedChannel): Promise<void> {
  const infoRepository = new MusicInfoRepository();
  const info = await infoRepository.get(channel.guild.id, channel.id);

  if (!info) {
    return;
  }
  await infoRepository.save({ guild_id: channel.guild.id, channel_id: channel.id, silent: info.silent ? 0 : 1 });

  const send = new EmbedBuilder()
    .setColor('#cc66cc')
    .setTitle(`サイレントモード設定: `)
    .setDescription(info.silent ? '無効に設定' : '有効に設定');

  (channel as VoiceChannel).send({ content: `サイレントモードを変更したよ！`, embeds: [send] });
}

/**
 * プレイヤーを更新/初期化する
 * @param channel
 * @returns
 */
async function updateAudioPlayer(channel: VoiceBasedChannel): Promise<PlayerData> {
  const PlayerData = Music.player.find((p) => p.guild_id === channel.guild.id);

  if (PlayerData) {
    const index = Music.player.findIndex((p) => p === PlayerData);
    return Music.player[index];
  }
  const p: PlayerData = {
    guild_id: channel.guild.id,
    channel,
    connection: joinVoiceChannel({
      adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
      channelId: channel.id,
      guildId: channel.guild.id,
      selfDeaf: true,
      selfMute: false,
    }),
    player: createAudioPlayer(),
  };
  p.connection.subscribe(p.player);
  Music.player.push(p);
  return p;
}

/**
 * プレイヤーを削除する
 * @param gid
 */
async function removeAudioPlayer(gid: string, cid: string): Promise<void> {
  const PlayerData = Music.player.find((p) => p.guild_id === gid && p.channel.id === cid);
  if (PlayerData) {
    Music.player = Music.player.filter((p) => p.guild_id !== gid && p.channel.id !== cid);
  }
}

/**
 * 再生中の音楽の再生位置を変更する
 * @param channel VoiceBasedChannel
 * @param seek number 秒数
 * @returns
 */
export async function seek(channel: VoiceBasedChannel, seek: number): Promise<void> {
  const infoRepo = new MusicInfoRepository();

  const playing = await infoRepo.get(channel.guild.id, channel.id);

  if (!playing || playing.url == undefined) {
    return;
  }

  try {
    const p = await updateAudioPlayer(channel);
    const stream = await pldl.stream(playing.url, { seek: seek, discordPlayerCompatibility: true });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    p.player.play(resource);

    await entersState(p.player, AudioPlayerStatus.Playing, 10 * 1000);
    await entersState(p.player, AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);
  } catch (e) {
    const error = e as Error;
    await Logger.put({
      guild_id: channel.guild?.id,
      channel_id: channel.id,
      user_id: undefined,
      level: LogLevel.ERROR,
      event: 'command|music-play',
      message: [JSON.stringify(error.message)],
    });
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setAuthor({ name: `音楽の取得に失敗した` })
      .setTitle(playing.title)
      .setURL(playing.url)
      .setDescription(JSON.stringify(error.message))
      .addFields({
        name: '再生キュー',
        value: `${CONFIG.COMMON.HOST_URL + '/music?gid=' + channel.guild.id + '&cid=' + channel.id}`,
      });
    (channel as VoiceChannel).send({ embeds: [send] });
  }
}
