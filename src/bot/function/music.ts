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
import ytpl from 'ytpl';
import { getRndArray } from '../../common/common';
import { Playlist } from '../../model/models';
import { MusicRepository } from '../../model/repository/musicRepository';
import { PlaylistRepository } from '../../model/repository/playlistRepository';

export class Music {
    static player: { id: string; player: AudioPlayer }[] = [];
}

/**
 * キューに音楽を追加する
 * @param channel 送信するchannel
 * @param url 動画url
 * @returns
 */
export async function add(channel: VoiceBasedChannel, url: string, userId: string): Promise<boolean> {
    const repository = new MusicRepository();
    const player = await getAudioPlayer(channel.guild.id);

    const status = player.state.status;

    const playlistFlag = ytpl.validateID(url);
    const movieFlag = ytdl.validateURL(url);

    if (movieFlag) {
        const ytinfo = await ytdl.getInfo(url);

        await repository.add(
            channel.guild.id,
            {
                guild_id: channel.guild.id,
                title: ytinfo.videoDetails.title,
                url: ytinfo.videoDetails.video_url,
                thumbnail: ytinfo.thumbnail_url
            },
            false
        );
        const musics = await repository.getAll(channel.guild.id);

        if (status === AudioPlayerStatus.Playing) {
            const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

            if (description.length >= 4000) {
                const sliced = musics.slice(0, 20);
                const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

                const send = new EmbedBuilder()
                    .setColor('#cc66cc')
                    .setTitle('キュー(先頭の20曲のみ表示しています): ')
                    .setDescription(description);

                (channel as VoiceChannel).send({ content: `追加: ${ytinfo.videoDetails.title}`, embeds: [send] });
                return true;
            }

            const send = new EmbedBuilder()
                .setColor('#cc66cc')
                .setTitle(`キュー(全${musics.length}曲): `)
                .setDescription(description ? description : 'none');

            (channel as VoiceChannel).send({ content: `追加: ${ytinfo.videoDetails.title}`, embeds: [send] });
            return true;
        }
        await playMusic(channel);
        return true;
    }

    if (playlistFlag) {
        const pid = await ytpl.getPlaylistID(url);
        console.log('pid:' + pid);
        try {
            const playlist = await ytpl(pid);
            console.log('playlist:' + JSON.stringify(playlist));
            const pm = playlist.items.map((p) => {
                return {
                    title: p.title,
                    url: p.url,
                    thumbnail: p.thumbnails[0]?.url ? p.thumbnails[0].url : ''
                };
            });
            for (const m of pm) {
                await repository.add(
                    channel.guild.id,
                    {
                        guild_id: channel.guild.id,
                        title: m.title,
                        url: m.url,
                        thumbnail: m.thumbnail
                    },
                    false
                );
            }

            const musics = await repository.getAll(channel.guild.id);

            if (status === AudioPlayerStatus.Playing) {
                const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

                if (description.length >= 4000) {
                    const sliced = musics.slice(0, 20);
                    const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

                    const send = new EmbedBuilder()
                        .setColor('#cc66cc')
                        .setTitle('キュー(先頭の20曲のみ表示しています): ')
                        .setDescription(description);

                    (channel as VoiceChannel).send({ content: `追加: ${playlist.title}`, embeds: [send] });
                    return true;
                }

                const send = new EmbedBuilder()
                    .setColor('#cc66cc')
                    .setTitle(`キュー(全${musics.length}曲): `)
                    .setDescription(description ? description : 'none');

                (channel as VoiceChannel).send({ content: `追加: ${playlist.title}`, embeds: [send] });
                return true;
            }
            await playMusic(channel);
            return true;
        } catch (e) {
            console.log(e);
            const send = new EmbedBuilder()
                .setColor('#cc66cc')
                .setTitle('エラー:')
                .setDescription('非公開のプレイリストを読み込んだ');

            (channel as VoiceChannel).send({
                content: `非公開のプレイリストみたい、公開か限定公開にして～！`,
                embeds: [send]
            });
            return false;
        }
    }

    const playlistRepository = new PlaylistRepository();
    const playlist = await playlistRepository.get(userId, url);
    if (playlist) {
        await add(channel, playlist.url, userId);
        return true;
    }

    if (!playlistFlag && !movieFlag) {
        const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

        (channel as VoiceChannel).send({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
        return false;
    }

    return false;
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
            url: info.videoDetails.video_url,
            thumbnail: info.thumbnail_url
        },
        true
    );

    const musics = await repository.getAll(channel.guild.id);

    const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

    if (description.length >= 4000) {
        const sliced = musics.slice(0, 20);
        const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
            .setDescription(description);

        (channel as VoiceChannel).send({ content: `割込: ${info.videoDetails.title}`, embeds: [send] });
    } else {
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(全${musics.length}曲): `)
            .setDescription(description ? description : 'none');
        (channel as VoiceChannel).send({ content: `割込: ${info.videoDetails.title}`, embeds: [send] });
    }

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
            title: music.title,
            url: music.url,
            thumbnail: music.thumbnail
        },
        true
    );

    await repository.remove(channel.guild.id, music.music_id);

    const newMusics = await repository.getAll(channel.guild.id);

    const description = newMusics.map((m) => m.music_id + ': ' + m.title).join('\n');

    if (description.length >= 4000) {
        const sliced = newMusics.slice(0, 20);
        const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
            .setDescription(description)
            .setThumbnail(music.thumbnail);

        (channel as VoiceChannel).send({ content: `割込: ${music.title}`, embeds: [send] });
    } else {
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(全${musics.length}曲): `)
            .setDescription(description ? description : 'none')
            .setThumbnail(music.thumbnail);

        (channel as VoiceChannel).send({ content: `割込: ${music.title}`, embeds: [send] });
    }

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
            .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
            .setDescription(description);

        (channel as VoiceChannel).send({
            content: `削除: ${musics.find((m) => m.music_id === musicId)?.title}`,
            embeds: [send]
        });
    } else {
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(全${musics.length}曲): `)
            .setDescription(description ? description : 'none');

        (channel as VoiceChannel).send({
            content: `削除: ${musics.find((m) => m.music_id === musicId)?.title}`,
            embeds: [send]
        });
    }
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

    const player = await updateAudioPlayer(channel.guild.id);
    connection.subscribe(player);

    const stream = ytdl(ytdl.getURLVideoID(playing.url), {
        filter: (format) => format.audioCodec === 'opus' && format.container === 'webm', //webm opus
        quality: 'highest',
        highWaterMark: 32 * 1024 * 1024 // https://github.com/fent/node-ytdl-core/issues/902
    });

    const resource = createAudioResource(stream, {
        inputType: StreamType.WebmOpus
    });

    const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

    if (description.length >= 4000) {
        const sliced = musics.slice(0, 20);
        const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
            .setDescription(description)
            .setThumbnail(playing.thumbnail);

        (channel as VoiceChannel).send({ content: `再生: ${playing.title}`, embeds: [send] });
    } else {
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(全${musics.length}曲): `)
            .setDescription(description ? description : 'none')
            .setThumbnail(playing.thumbnail);

        (channel as VoiceChannel).send({ content: `再生: ${playing.title}`, embeds: [send] });
    }

    player.play(resource);

    await entersState(player, AudioPlayerStatus.Playing, 10 * 1000);
    await entersState(player, AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);

    await playMusic(channel);
}

/**
 * 音楽を停止する
 * @param channel 送信するchannel
 */
export async function stopMusic(channel: VoiceBasedChannel) {
    const repository = new MusicRepository();
    const musics = await repository.getAll(channel.guild.id);

    const player = await getAudioPlayer(channel.guild.id);

    if (musics.length > 0) {
        player.stop();
    } else {
        (channel as VoiceChannel).send({ content: '全ての曲の再生が終わったよ！またね～！' });
        await removeAudioPlayer(channel.guild.id);
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
    await removeAudioPlayer(gid);

    const connection = getVoiceConnection(gid);
    if (connection) {
        connection.destroy();
        return true;
    }
    return false;
}

/**
 * 全曲をシャッフルする
 * @param gid guild.id
 * @returns
 */
export async function shuffleMusic(channel: VoiceBasedChannel): Promise<boolean> {
    const repository = new MusicRepository();
    const musics = await repository.getAll(channel.guild.id);

    const length = musics.length;
    if (length <= 1) {
        const send = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`エラー: `)
            .setDescription('シャッフル可能曲数を満たしていない');
        (channel as VoiceChannel).send({ content: `シャッフルする時はキューに2曲以上追加してね！`, embeds: [send] });
        return false;
    }
    const rnd = getRndArray(musics.length - 1);

    for (let i = 0; i < length; i++) {
        musics[i].music_id = rnd[i];
    }

    const shuffled = await repository.saveAll(channel.guild.id, musics);
    shuffled.sort((a, b) => a.music_id - b.music_id);

    const description = shuffled.map((m) => m.music_id + ': ' + m.title).join('\n');

    if (description.length >= 4000) {
        const sliced = shuffled.slice(0, 20);
        const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
            .setDescription(description);

        (channel as VoiceChannel).send({ content: `シャッフル完了: `, embeds: [send] });
    } else {
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(全${musics.length}曲): `)
            .setDescription(description ? description : 'none');
        (channel as VoiceChannel).send({ content: `シャッフル完了: `, embeds: [send] });
    }
    return true;
}

export async function pause(gid: string): Promise<void> {
    const player = await getAudioPlayer(gid);

    console.log(player.state.status);

    if (player.state.status === AudioPlayerStatus.Paused) {
        player.unpause();
    }
    if (player.state.status === AudioPlayerStatus.Playing) {
        player.pause();
    }
}

/**
 * 現在の予約状況を表示する
 * @param channel 送信するチャンネル
 * @returns
 */
export async function showQueue(channel: VoiceBasedChannel): Promise<void> {
    const repository = new MusicRepository();
    const musics = await repository.getAll(channel.guild.id);

    const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

    if (description.length >= 4000) {
        const sliced = musics.slice(0, 20);
        const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
            .setDescription(description);

        (channel as VoiceChannel).send({ content: `現在の予約状況: `, embeds: [send] });
    } else {
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setTitle(`キュー(全${musics.length}曲): `)
            .setDescription(description ? description : 'none');
        (channel as VoiceChannel).send({ content: `現在の予約状況: `, embeds: [send] });
    }
    return;
}

export async function getPlaylist(userId: string): Promise<Playlist[]> {
    const repository = new PlaylistRepository();
    return await repository.getAll(userId);
}

export async function removePlaylist(userId: string, name: string): Promise<boolean> {
    const repository = new PlaylistRepository();
    return await repository.remove(userId, name);
}

async function getAudioPlayer(gid: string): Promise<AudioPlayer> {
    let PlayerData = Music.player.find((p) => p.id === gid);

    if (!PlayerData) {
        PlayerData = { id: gid, player: createAudioPlayer() };
        Music.player.push(PlayerData);
    }
    return PlayerData.player;
}

async function updateAudioPlayer(gid: string): Promise<AudioPlayer> {
    const PlayerData = Music.player.find((p) => p.id === gid);

    if (PlayerData) {
        const index = Music.player.findIndex((p) => p === PlayerData);
        Music.player[index].player = createAudioPlayer();
        return Music.player[index].player;
    }
    const p = { id: gid, player: createAudioPlayer() };
    Music.player.push(p);
    return p.player;
}

async function removeAudioPlayer(gid: string): Promise<void> {
    const PlayerData = Music.player.find((p) => p.id === gid);
    if (PlayerData) {
        Music.player = Music.player.filter((p) => p.id !== gid);
    }
}
