import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    entersState,
    getVoiceConnection,
    joinVoiceChannel,
    StreamType
} from '@discordjs/voice';
import { EmbedBuilder, VoiceBasedChannel, VoiceChannel } from 'discord.js';
import ytdl from 'ytdl-core';
import { MusicRepository } from '../../model/repository/musicRepository';

export class Music {
    static player: AudioPlayer;
}

/**
 * キューに音楽を追加する
 * @param channel 送信するchannel
 * @param url 動画url
 * @returns
 */
export async function add(channel: VoiceBasedChannel, url: string): Promise<boolean> {
    if (!ytdl.validateURL(url)) {
        return false;
    }
    const info = await ytdl.getInfo(url);
    const repository = new MusicRepository();

    const result = await repository.add(
        channel.guild.id,
        {
            guild_id: channel.guild.id,
            title: info.videoDetails.title,
            url: info.videoDetails.video_url
        },
        false
    );

    const musics = await repository.getAll(channel.guild.id);

    if (Music.player?.state?.status === AudioPlayerStatus.Playing) {
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle('キュー: ')
            .setDescription(musics.map((m) => m.music_id + ': ' + m.title).join('\n'));

        (channel as VoiceChannel).send({ content: `追加: ${info.videoDetails.title}`, embeds: [send] });
    } else {
        await playMusic(channel);
    }

    return result;
}

/**
 * 割込予約を行う
 * @param channel 送信するchannel
 * @param url 動画url
 * @returns
 */
export async function interruptMusic(channel: VoiceBasedChannel, url: string): Promise<boolean> {
    if (!ytdl.validateURL(url)) {
        return false;
    }
    const info = await ytdl.getInfo(url);
    const repository = new MusicRepository();

    const result = await repository.add(
        channel.guild.id,
        {
            guild_id: channel.guild.id,
            title: info.videoDetails.title,
            url: info.videoDetails.video_url
        },
        true
    );

    const musics = await repository.getAll(channel.guild.id);

    const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle('キュー: ')
        .setDescription(
            musics
                .filter((m) => m.music_id !== musics[1].music_id)
                .map((m) => m.music_id + ': ' + m.title)
                .join('\n')
        );

    (channel as VoiceChannel).send({ content: `割込: ${info.videoDetails.title}`, embeds: [send] });

    return result;
}

/**
 * 指定した予約番号を一番上に持ち上げる
 * @param channel 送信するchannel
 * @param index music_id
 * @returns
 */
export async function interruptIndex(channel: VoiceBasedChannel, index: number): Promise<boolean> {
    const repository = new MusicRepository();
    const musics = await repository.getAll(channel.guild.id);
    const music = musics.find((m) => m.music_id === index);

    if (!music) {
        return false;
    }

    const result = await repository.add(
        channel.guild.id,
        {
            guild_id: channel.guild.id,
            title: music?.title,
            url: music?.url
        },
        true
    );

    await repository.remove(channel.guild.id, music.music_id);

    const newMusics = await repository.getAll(channel.guild.id);

    const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle('キュー: ')
        .setDescription(newMusics.map((m) => m.music_id + ': ' + m.title).join('\n'));

    (channel as VoiceChannel).send({ content: `割込: ${music.title}`, embeds: [send] });

    return result;
}

/**
 * キューから除外する
 * @param gid guild.id
 * @param musicId music_id
 * @returns
 */
export async function remove(gid: string, musicId?: number): Promise<boolean> {
    const repository = new MusicRepository();
    return await repository.remove(gid, musicId);
}

/**
 * キューから指定予約番号を除外する
 * @param channel 送信するchannel
 * @param gid guild.id
 * @param musicId music_id
 */
export async function removeId(channel: VoiceBasedChannel, gid: string, musicId: number): Promise<void> {
    const repository = new MusicRepository();
    const musics = await repository.getAll(gid);
    await repository.remove(gid, musicId);

    const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle('キュー: ')
        .setDescription(
            musics
                .filter((m) => m.music_id !== musicId)
                .map((m) => m.music_id + ': ' + m.title)
                .join('\n')
        );

    (channel as VoiceChannel).send({
        content: `削除: ${musics.find((m) => m.music_id === musicId)?.title}`,
        embeds: [send]
    });
}

/**
 * 音楽をキューから取り出して再生する
 * @param channel 送信するchannel
 * @returns
 */
export async function playMusic(channel: VoiceBasedChannel) {
    const repository = new MusicRepository();
    const musics = await repository.getAll(channel.guild.id);

    if (musics.length <= 0) {
        await stopMusic(channel);
        return;
    }

    const playing = musics[0];
    musics.shift();
    await remove(playing.guild_id, playing.music_id);

    const vc = getVoiceConnection(channel.guild.id);

    const connection = vc
        ? vc
        : joinVoiceChannel({
              adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
              channelId: channel.id,
              guildId: channel.guild.id,
              selfDeaf: true,
              selfMute: false
          });

    Music.player = createAudioPlayer();
    connection.subscribe(Music.player);

    const stream = ytdl(ytdl.getURLVideoID(playing.url), {
        filter: (format) => format.audioCodec === 'opus' && format.container === 'webm', //webm opus
        quality: 'highest',
        highWaterMark: 32 * 1024 * 1024 // https://github.com/fent/node-ytdl-core/issues/902
    });

    const resource = createAudioResource(stream, {
        inputType: StreamType.WebmOpus
    });

    const queue = musics.map((m) => m.music_id + ': ' + m.title).join('\n');
    const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle('キュー: ')
        .setDescription(queue ? queue : 'none');

    (channel as VoiceChannel).send({ content: `再生中: ${playing.title}`, embeds: [send] });

    Music.player.play(resource);

    await entersState(Music.player, AudioPlayerStatus.Playing, 10 * 1000);
    await entersState(Music.player, AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);

    await playMusic(channel);
}

/**
 * 音楽を停止する
 * @param channel 送信するchannel
 */
export async function stopMusic(channel: VoiceBasedChannel) {
    const repository = new MusicRepository();
    const musics = await repository.getAll(channel.guild.id);

    if (musics.length > 0) {
        Music.player.stop();
    } else {
        (channel as VoiceChannel).send({ content: '全ての曲の再生が終わったよ！またね～！' });
        const connection = getVoiceConnection(channel.guild.id);
        connection?.destroy();
    }
}

/**
 * 音楽を強制停止し、キューを全て削除する
 * @param gid guild.id
 * @returns
 */
export async function extermAudioPlayer(gid: string): Promise<boolean> {
    await remove(gid);

    const connection = getVoiceConnection(gid);
    if (connection) {
        connection.destroy();
        return true;
    }
    return false;
}
