/**
 * 音楽機能の Discord アダプター
 * キュー・再生設定・プレイリストの DB 状態は @orangebot/shared の MusicService が担当し、
 * ここでは音声接続・ストリーミング再生・Embed 整形を行う (Phase 2-3)
 */
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
} from '@discordjs/voice';
import { EmbedBuilder, VoiceBasedChannel, VoiceChannel } from 'discord.js';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import prism from 'prism-media';
import { YTNodes } from 'youtubei.js';
import { Logger } from '../../common/logger.js';
import { CONFIG } from '../../config/config.js';
import { Music, PlayerData } from '../../constant/music/music.js';
import { LogLevel, MusicService, Playlist } from '@orangebot/shared';
import { extractPlaylistId, extractVideoId, getInnertube } from '../request/innertube.js';
import { getPlaylistItems } from '../request/youtube.js';
import { getNiconicoInfo, getNiconicoStream, isNiconicoUrl } from '../request/niconico.js';

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
  if (url.includes('intl-ja/')) {
    url = url.replace('intl-ja/', '');
  }

  const videoId = extractVideoId(url);
  const playlistId = extractPlaylistId(url);

  if (videoId && !url.includes('playlist')) {
    await addYoutubeMusic(channel, 'video', url, false, loop, shuffle);
    return true;
  }

  if (playlistId) {
    await addYoutubeMusic(channel, 'playlist', url, false, loop, shuffle);
    return true;
  }

  if (isNiconicoUrl(url)) {
    await addNiconicoMusic(channel, url, false, loop, shuffle);
    return true;
  }

  const musicService = new MusicService();
  const playlist = await musicService.getPlaylistByName(userId, url);
  if (playlist) {
    await add(channel, playlist.url, userId, Boolean(playlist.loop), Boolean(playlist.shuffle));
    return true;
  }
  const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

  (channel as VoiceChannel).send({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
  return false;
}

/**
 * 音楽を検索してキューに追加する
 * @param channel 送信するchannel
 * @param word 検索語句
 * @returns
 */
export async function search(channel: VoiceBasedChannel, word: string): Promise<boolean> {
  const innertube = await getInnertube();
  const result = await innertube.search(word, { type: 'video' });

  const searched = result.videos
    .filterType(YTNodes.Video)
    .slice(0, 5)
    .map((v) => ({
      url: `https://www.youtube.com/watch?v=${v.video_id}`,
      title: v.title.toString(),
      views: Number(v.view_count?.toString().replace(/[^0-9]/g, '')) || 0,
    }));

  if (searched.length === 0) {
    const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`検索結果が見つからない`);

    (channel as VoiceChannel).send({ content: `検索結果が見つからなかった…`, embeds: [send] });
    return false;
  }

  const isMv = searched.find((s) => s.title.match(/((O|o)fficial|MV|mv|(M|m)usic)/) !== null);
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
  const musicService = new MusicService();
  const p = await updateAudioPlayer(channel);
  const status = p.player.state.status;

  if (type === 'video') {
    const videoId = extractVideoId(url) ?? (/^[\w-]{11}$/.test(url) ? url : null);
    if (!videoId) {
      return false;
    }

    const innertube = await getInnertube();
    const ytinfo = (await innertube.getBasicInfo(videoId)).basic_info;
    const title = ytinfo.title ?? '';
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnail = ytinfo.thumbnail?.[0]?.url ?? '';

    await musicService.addTrack(
      channel.guild.id,
      channel.id,
      {
        title: title,
        url: videoUrl,
        thumbnail: thumbnail,
      },
      !!interrupt
    );
    if (interrupt) {
      return true;
    }

    const musics = await musicService.getQueue(channel.guild.id, channel.id);

    if (status === AudioPlayerStatus.Playing) {
      const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');
      const addMusic = musics.find((m) => m.url === videoUrl);

      if (description.length >= 4000) {
        const sliced = musics.slice(0, 20);
        const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

        const send = new EmbedBuilder()
          .setColor('#cc66cc')
          .setAuthor({ name: `追加: (${addMusic?.music_id}) ${title}` })
          .setTitle('キュー(先頭の20曲のみ表示しています): ')
          .setDescription(description)
          .setThumbnail(thumbnail);

        (channel as VoiceChannel).send({ embeds: [send] });
        return true;
      }

      const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setAuthor({ name: `追加: (${addMusic?.music_id}) ${title}` })
        .setTitle(`キュー(全${musics.length}曲): `)
        .setDescription(description ? description : 'none')
        .setThumbnail(thumbnail);

      (channel as VoiceChannel).send({ embeds: [send] });
      return true;
    }
    await initPlayerInfo(channel, !!loop, !!shuffle);
    await playMusic(channel);
    return true;
  }

  if (type === 'playlist') {
    const pid = extractPlaylistId(url) ?? '';

    try {
      const pm = await getPlaylistItems(pid);

      await musicService.addTracks(channel.guild.id, channel.id, pm.playlists, 'youtube');

      const musics = await musicService.getQueue(channel.guild.id, channel.id);

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
 * ニコニコ動画の情報を取得し、キューに追加する
 * @param channel
 * @param url watch URL または 動画ID
 * @param interrupt
 * @param loop
 * @param shuffle
 * @returns
 */
export async function addNiconicoMusic(
  channel: VoiceBasedChannel,
  url: string,
  interrupt?: boolean,
  loop?: boolean,
  shuffle?: boolean
): Promise<boolean> {
  const musicService = new MusicService();
  const p = await updateAudioPlayer(channel);
  const status = p.player.state.status;

  let info;
  try {
    info = await getNiconicoInfo(url);
  } catch (e) {
    await Logger.put({
      guild_id: channel.guild?.id,
      channel_id: channel.id,
      user_id: undefined,
      level: LogLevel.ERROR,
      event: 'command|music-add',
      message: [JSON.stringify((e as Error).message)],
    });
    const send = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('エラー')
      .setDescription('ニコニコ動画の情報を取得できなかった (削除・非公開・会員限定の可能性)');

    (channel as VoiceChannel).send({ content: `ニコニコ動画を取得できなかった…`, embeds: [send] });
    return false;
  }

  const title = info.title;
  const videoUrl = `https://www.nicovideo.jp/watch/${info.id}`;
  const thumbnail = info.thumbnails[0]?.url ?? '';

  await musicService.addTrack(
    channel.guild.id,
    channel.id,
    {
      title: title,
      url: videoUrl,
      thumbnail: thumbnail,
    },
    !!interrupt
  );
  if (interrupt) {
    return true;
  }

  const musics = await musicService.getQueue(channel.guild.id, channel.id);

  if (status === AudioPlayerStatus.Playing) {
    const addMusic = musics.find((m) => m.url === videoUrl);
    const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

    if (description.length >= 4000) {
      const sliced = musics.slice(0, 20);
      const slicedDescription = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

      const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setAuthor({ name: `追加: (${addMusic?.music_id}) ${title}` })
        .setTitle('キュー(先頭の20曲のみ表示しています): ')
        .setDescription(slicedDescription)
        .setThumbnail(thumbnail);

      (channel as VoiceChannel).send({ embeds: [send] });
      return true;
    }

    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: `追加: (${addMusic?.music_id}) ${title}` })
      .setTitle(`キュー(全${musics.length}曲): `)
      .setDescription(description ? description : 'none')
      .setThumbnail(thumbnail);

    (channel as VoiceChannel).send({ embeds: [send] });
    return true;
  }
  await initPlayerInfo(channel, !!loop, !!shuffle);
  await playMusic(channel);
  return true;
}

/**
 * プレイヤーの再生設定を取得する
 * @param channel
 * @returns
 */
export async function getPlayerInfo(channel: VoiceBasedChannel): Promise<void> {
  const musicService = new MusicService();
  const info = await musicService.getSettings(channel.guild.id, channel.id);

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
  const musicService = new MusicService();

  switch (name) {
    case 'sf': {
      const next = await musicService.toggleShuffle(channel.guild.id, channel.id);
      if (next === null) {
        return;
      }
      const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle(`再生設定の変更: `)
        .setDescription(`シャッフル: ${next === 1 ? '有効' : '無効'}`);
      (channel as VoiceChannel).send({
        embeds: [send],
      });
      break;
    }
    case 'lp': {
      const next = await musicService.toggleLoop(channel.guild.id, channel.id);
      if (next === null) {
        return;
      }
      const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle(`再生設定の変更: `)
        .setDescription(`ループ: ${next === 1 ? '有効' : '無効'}`);
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
  const musicService = new MusicService();
  const { shouldShuffle } = await musicService.initPlayerSettings(channel.guild.id, channel.id, loop, shuffle);

  if (shouldShuffle) {
    await shuffleMusic(channel);
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
  const videoId = extractVideoId(url);

  if (!videoId) {
    return false;
  }
  if (url.includes('playlist')) {
    return true;
  }

  const musicService = new MusicService();
  const m = addYoutubeMusic(channel, 'video', url, true);

  const innertube = await getInnertube();
  const ytinfo = (await innertube.getBasicInfo(videoId)).basic_info;
  const musics = await musicService.getQueue(channel.guild.id, channel.id);
  const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

  if (description.length >= 4000) {
    const sliced = musics.slice(0, 20);
    const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: `割込: ${ytinfo.title}` })
      .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
      .setDescription(description);

    (channel as VoiceChannel).send({ embeds: [send] });
  } else {
    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: `割込: ${ytinfo.title}` })
      .setTitle(`キュー(全${musics.length}曲): `)
      .setDescription(description ? description : 'none');
    (channel as VoiceChannel).send({ embeds: [send] });
  }

  await m;
  return true;
}

/**
 * 指定した予約番号を一番上に持ち上げる
 * @param channel 送信するchannel
 * @param index music_id
 * @returns
 */
export async function interruptIndex(channel: VoiceBasedChannel, index: number): Promise<boolean> {
  const musicService = new MusicService();
  const musics = await musicService.getQueue(channel.guildId, channel.id);
  const music = musics.find((m) => m.music_id === index);

  if (!music) {
    return false;
  }

  const result = await musicService.addTrack(
    channel.guild.id,
    channel.id,
    {
      title: music.title,
      url: music.url,
      thumbnail: music.thumbnail,
    },
    true
  );

  await musicService.removeTracks(channel.guild.id, channel.id, music.music_id);

  const newMusics = await musicService.getQueue(channel.guild.id, channel.id);

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
  const musicService = new MusicService();
  return await musicService.removeTracks(gid, cid, musicId);
}

/**
 * キューから指定予約番号を除外する
 * @param channel 送信するchannel
 * @param gid guild.id
 * @param musicId music_id
 */
export async function removeId(channel: VoiceBasedChannel, gid: string, musicId: number): Promise<void> {
  const musicService = new MusicService();
  const musics = await musicService.getQueue(gid, channel.id);

  if (musics.length <= 0) {
    return;
  }

  await musicService.removeTracks(gid, channel.id, musicId);

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
  const musicService = new MusicService();

  const musics = await musicService.getQueue(channel.guild.id, channel.id);
  const info = await musicService.getSettings(channel.guild.id, channel.id);

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
  await musicService.updatePlayState(playing.guild_id, channel.id, playing.music_id, true);
  await musicService.saveNowPlaying(playing.guild_id, playing.channel_id, {
    title: playing.title,
    url: playing.url,
    thumbnail: playing.thumbnail,
  });
  try {
    const p = await updateAudioPlayer(channel);

    let resource;
    if (isNiconicoUrl(playing.url)) {
      const { stream } = await getNiconicoStream(playing.url);
      resource = createAudioResource(stream);
    } else {
      const videoId = extractVideoId(playing.url);
      if (!videoId) {
        throw new Error(`動画IDを取得できない: ${playing.url}`);
      }

      const innertube = await getInnertube();
      const stream = await innertube.download(videoId, { type: 'audio', quality: 'best', client: 'TV' });
      resource = createAudioResource(Readable.fromWeb(stream as WebReadableStream<Uint8Array>));
    }

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

  const musicService = new MusicService();
  const musics = await musicService.getQueue(channel.guild.id, channel.id);
  const info = await musicService.getSettings(channel.guild.id, channel.id);

  if (!info || (musics.length <= 0 && info.is_loop === 0)) {
    await musicService.removeSettings(channel.guild.id, channel.id);

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
  const musicService = new MusicService();
  await musicService.removeSettings(gid, cid);

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
  const musicService = new MusicService();
  const shuffled = await musicService.shuffleQueue(channel.guild.id, channel.id);

  if (!shuffled) {
    return true;
  }

  const description = shuffled.map((m) => m.music_id + ': ' + m.title).join('\n');

  if (description.length >= 4000) {
    const sliced = shuffled.slice(0, 20);
    const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: 'シャッフル完了' })
      .setTitle(`キュー(20曲表示/ 全${shuffled.length}曲): `)
      .setDescription(description);

    (channel as VoiceChannel).send({ embeds: [send] });
  } else {
    const send = new EmbedBuilder()
      .setColor('#cc66cc')
      .setAuthor({ name: 'シャッフル完了' })
      .setTitle(`キュー(全${shuffled.length}曲): `)
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
  const musicService = new MusicService();
  await musicService.updatePlayState(gid, cid, musicId, state);
}

/**
 * 全ての音楽の再生状態をリセットする
 * @param gid
 */
export async function resetAllPlayState(gid: string, cid: string) {
  const musicService = new MusicService();
  await musicService.resetAllPlayState(gid, cid);
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
  const musicService = new MusicService();
  const musics = await musicService.getQueue(channel.guild.id, channel.id);
  const info = await musicService.getSettings(channel.guild.id, channel.id);

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
  const musicService = new MusicService();
  return await musicService.getPlaylists(userId);
}

/**
 * プレイリストを削除する
 * @param userId
 * @param name
 * @returns
 */
export async function removePlaylist(userId: string, name: string): Promise<boolean> {
  const musicService = new MusicService();
  return await musicService.removePlaylist(userId, name);
}

/**
 * 音楽の通知状態を変更する
 * @param channel
 * @returns
 */
export async function changeNotify(channel: VoiceBasedChannel): Promise<void> {
  const musicService = new MusicService();
  const next = await musicService.toggleSilent(channel.guild.id, channel.id);

  if (next === null) {
    return;
  }

  const send = new EmbedBuilder()
    .setColor('#cc66cc')
    .setTitle(`サイレントモード設定: `)
    .setDescription(next === 1 ? '有効に設定' : '無効に設定');

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
  const musicService = new MusicService();

  const playing = await musicService.getSettings(channel.guild.id, channel.id);

  if (!playing || playing.url == undefined) {
    return;
  }

  const isNiconico = isNiconicoUrl(playing.url);
  if (!isNiconico && !extractVideoId(playing.url)) {
    return;
  }

  try {
    const p = await updateAudioPlayer(channel);

    let sourceStream: Readable;
    if (isNiconico) {
      const { stream } = await getNiconicoStream(playing.url);
      sourceStream = stream;
    } else {
      const videoId = extractVideoId(playing.url)!;
      const innertube = await getInnertube();
      const stream = await innertube.download(videoId, { type: 'audio', quality: 'best', client: 'TV' });
      sourceStream = Readable.fromWeb(stream as WebReadableStream<Uint8Array>);
    }

    // ffmpegで指定秒数まで読み飛ばしてPCMに変換する
    const transcoder = new prism.FFmpeg({
      args: ['-analyzeduration', '0', '-loglevel', '0', '-ss', String(seek), '-i', '-', '-f', 's16le', '-ar', '48000', '-ac', '2'],
    });

    const resource = createAudioResource(sourceStream.pipe(transcoder), {
      inputType: StreamType.Raw,
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
