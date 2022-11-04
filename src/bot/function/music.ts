import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    entersState,
    getVoiceConnection,
    joinVoiceChannel
} from '@discordjs/voice';
import { EmbedBuilder, VoiceBasedChannel, VoiceChannel } from 'discord.js';
import pldl from 'play-dl';
import { getRndArray } from '../../common/common';
import { CONFIG } from '../../config/config';
import { Playlist } from '../../model/models';
import { MusicInfoRepository } from '../../model/repository/musicInfoRepository';
import { MusicRepository } from '../../model/repository/musicRepository';
import { PlaylistRepository } from '../../model/repository/playlistRepository';
import { getPlaylistItems } from '../request/youtubeAPI';

export class Music {
    static player: { id: string; player: AudioPlayer }[] = [];
}

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
    const repository = new MusicRepository();
    const player = await getAudioPlayer(channel.guild.id);

    const status = player.state.status;

    const ytFlag = pldl.yt_validate(url);

    if (ytFlag === 'video') {
        const ytinfo = await pldl.video_info(url);

        await repository.add(
            channel.guild.id,
            {
                guild_id: channel.guild.id,
                title: ytinfo.video_details.title,
                url: ytinfo.video_details.url,
                thumbnail: ytinfo.video_details.thumbnails[0].url
            },
            false
        );
        const musics = await repository.getQueue(channel.guild.id);

        if (status === AudioPlayerStatus.Playing) {
            const description = musics.map((m) => m.music_id + ': ' + m.title).join('\n');

            if (description.length >= 4000) {
                const sliced = musics.slice(0, 20);
                const description = sliced.map((m) => m.music_id + ': ' + m.title).join('\n');

                const send = new EmbedBuilder()
                    .setColor('#cc66cc')
                    .setAuthor({ name: `追加: ${ytinfo.video_details.title}` })
                    .setTitle('キュー(先頭の20曲のみ表示しています): ')
                    .setDescription(description);

                (channel as VoiceChannel).send({ embeds: [send] });
                return true;
            }

            const send = new EmbedBuilder()
                .setColor('#cc66cc')
                .setAuthor({ name: `追加: ${ytinfo.video_details.title}` })
                .setTitle(`キュー(全${musics.length}曲): `)
                .setDescription(description ? description : 'none');

            (channel as VoiceChannel).send({ embeds: [send] });
            return true;
        }
        await initPlayerInfo(channel, !!loop, !!shuffle);
        await playMusic(channel);
        return true;
    }

    if (ytFlag === 'playlist') {
        const pid = new URL(url).searchParams.get('list') ?? '';

        try {
            const pm = await getPlaylistItems(pid);

            await repository.addRange(channel.guild.id, pm.playlists);

            const musics = await repository.getQueue(channel.guild.id);

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
        await add(channel, playlist.url, userId, Boolean(playlist.loop), Boolean(playlist.shuffle));
        return true;
    }

    if (ytFlag === false) {
        const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`URLが不正`);

        (channel as VoiceChannel).send({ content: `YoutubeのURLを指定して～！`, embeds: [send] });
        return false;
    }

    return false;
}

export async function getPlayerInfo(channel: VoiceBasedChannel): Promise<void> {
    const repository = new MusicInfoRepository();
    const info = await repository.get(channel.guild.id);

    if (!info) {
        return;
    }

    const description = [
        `サイレント: ${info.silent === 0 ? '無効' : '有効'}`,
        `ループ: ${info.is_loop === 0 ? '無効' : '有効'}`,
        `シャッフル: ${info.is_shuffle === 0 ? '無効' : '有効'}`
    ].join('\n');

    const send = new EmbedBuilder().setColor('#cc66cc').setTitle(`再生設定: `).setDescription(description);
    (channel as VoiceChannel).send({
        embeds: [send]
    });
}

export async function editPlayerInfo(channel: VoiceBasedChannel, name: string): Promise<void> {
    const repository = new MusicInfoRepository();
    const info = await repository.get(channel.guild.id);

    if (!info) {
        return;
    }

    switch (name) {
        case 'sf': {
            await repository.save({ guild_id: channel.guild.id, is_shuffle: info.is_shuffle === 0 ? 1 : 0 });
            const send = new EmbedBuilder()
                .setColor('#cc66cc')
                .setTitle(`再生設定の変更: `)
                .setDescription(`シャッフル: ${info.is_shuffle === 0 ? '有効' : '無効'}`);
            (channel as VoiceChannel).send({
                embeds: [send]
            });
            break;
        }
        case 'lp': {
            await repository.save({ guild_id: channel.guild.id, is_loop: info.is_loop === 0 ? 1 : 0 });
            const send = new EmbedBuilder()
                .setColor('#cc66cc')
                .setTitle(`再生設定の変更: `)
                .setDescription(`ループ: ${info.is_loop === 0 ? '有効' : '無効'}`);
            (channel as VoiceChannel).send({
                embeds: [send]
            });
            break;
        }
        default: {
            break;
        }
    }
}

export async function initPlayerInfo(channel: VoiceBasedChannel, loop?: boolean, shuffle?: boolean): Promise<void> {
    const repository = new MusicInfoRepository();
    const info = await repository.get(channel.guild.id);

    if (!info) {
        if (loop) {
            await repository.save({ guild_id: channel.guild.id, is_loop: 1 });
        } else {
            await repository.save({ guild_id: channel.guild.id, is_loop: 0 });
        }

        if (shuffle) {
            await repository.save({ guild_id: channel.guild.id, is_shuffle: 1 });
            await shuffleMusic(channel);
        } else {
            await repository.save({ guild_id: channel.guild.id, is_shuffle: 0 });
        }
    } else {
        if (info.is_loop) {
            await resetAllPlayState(channel.guild.id);
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
    if (!pldl.yt_validate(url)) {
        return false;
    }
    const info = await pldl.video_info(url);
    const repository = new MusicRepository();

    const result = await repository.add(
        channel.guild.id,
        {
            guild_id: channel.guild.id,
            title: info.video_details.title,
            url: info.video_details.url,
            thumbnail: info.video_details.thumbnails[0].url
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
            .setAuthor({ name: `割込: ${info.video_details.title}` })
            .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
            .setDescription(description);

        (channel as VoiceChannel).send({ embeds: [send] });
    } else {
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setAuthor({ name: `割込: ${info.video_details.title}` })
            .setTitle(`キュー(全${musics.length}曲): `)
            .setDescription(description ? description : 'none');
        (channel as VoiceChannel).send({ embeds: [send] });
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
            .setAuthor({ name: `削除: ${musics.find((m) => m.music_id === musicId)?.title}` })
            .setTitle(`キュー(20曲表示/ 全${musics.length}曲): `)
            .setDescription(description);

        (channel as VoiceChannel).send({
            embeds: [send]
        });
    } else {
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setAuthor({ name: `削除: ${musics.find((m) => m.music_id === musicId)?.title}` })
            .setTitle(`キュー(全${musics.length}曲): `)
            .setDescription(description ? description : 'none');

        (channel as VoiceChannel).send({
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
    const repo_music = new MusicRepository();
    const repo_info = new MusicInfoRepository();

    const musics = await repo_music.getQueue(channel.guild.id);
    const info = await repo_info.get(channel.guild.id);

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
    await updatePlayState(playing.guild_id, playing.music_id, true);
    await repo_info.save({
        guild_id: playing.guild_id,
        title: playing.title,
        url: playing.url,
        thumbnail: playing.thumbnail
    });

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
    const stream = await pldl.stream(playing.url);

    const resource = createAudioResource(stream.stream, {
        inputType: stream.type
    });

    if (info?.silent === 0) {
        const slicedMusics = musics.slice(0, 4);
        const description = slicedMusics.map((m) => m.music_id + ': ' + m.title).join('\n');
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setAuthor({ name: `再生中の音楽情報/ 全${musics.length}曲` })
            .setTitle(playing.title)
            .setURL(playing.url)
            .setDescription(description ? description : 'none')
            .setThumbnail(playing.thumbnail)
            .addFields({
                name: '再生キュー',
                value: `${CONFIG.HOST_URL + ':' + CONFIG.PORT + '/music?gid=' + channel.guild.id}`
            });
        (channel as VoiceChannel).send({ embeds: [send] });
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
    const player = await getAudioPlayer(channel.guild.id);

    const infoRepository = new MusicInfoRepository();
    const info = await infoRepository.get(channel.guild.id);

    if (!info || info.is_loop === 0) {
        await infoRepository.remove(channel.guild.id);

        (channel as VoiceChannel).send({ content: '全ての曲の再生が終わったよ！またね～！' });
        await removeAudioPlayer(channel.guild.id);
        await remove(channel.guild.id);
        const connection = getVoiceConnection(channel.guild.id);
        connection?.destroy();
        return;
    }
    player.stop();
}

/**
 * 音楽を強制停止し、キューを全て削除する
 * @param gid guild.id
 * @returns
 */
export async function extermAudioPlayer(gid: string): Promise<boolean> {
    await remove(gid);
    await removeAudioPlayer(gid);
    const infoRepository = new MusicInfoRepository();
    await infoRepository.remove(gid);

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
        return true;
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

export async function updatePlayState(gid: string, musicId: number, state: boolean) {
    const repository = new MusicRepository();
    await repository.updatePlayState(gid, musicId, state);
}

export async function resetAllPlayState(gid: string) {
    const repository = new MusicRepository();
    await repository.resetPlayState(gid);
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
    const infoRepository = new MusicInfoRepository();
    const musics = await repository.getQueue(channel.guild.id);
    const info = await infoRepository.get(channel.guild.id);

    if (!info) {
        return;
    }

    if (musics.length > 0) {
        const slicedMusics = musics.slice(0, 4);
        const description = slicedMusics.map((m) => m.music_id + ': ' + m.title).join('\n');
        const send = new EmbedBuilder()
            .setColor('#cc66cc')
            .setAuthor({ name: `再生中の音楽情報/ 全${musics.length}曲` })
            .setTitle(info.title)
            .setURL(info.url)
            .setDescription(description)
            .setThumbnail(info.thumbnail)
            .addFields({
                name: '再生キュー',
                value: `${CONFIG.HOST_URL + ':' + CONFIG.PORT + '/music?gid=' + channel.guild.id}`
            });
        (channel as VoiceChannel).send({ embeds: [send] });
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

export async function changeNotify(channel: VoiceBasedChannel): Promise<void> {
    const infoRepository = new MusicInfoRepository();
    const info = await infoRepository.get(channel.guild.id);

    if (!info) {
        return;
    }
    await infoRepository.save({ guild_id: channel.guild.id, silent: info.silent ? 0 : 1 });

    const send = new EmbedBuilder()
        .setColor('#cc66cc')
        .setTitle(`サイレントモード設定: `)
        .setDescription(info.silent ? '無効に設定' : '有効に設定');

    (channel as VoiceChannel).send({ content: `サイレントモードを変更したよ！`, embeds: [send] });
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
