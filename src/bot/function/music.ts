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
import { VoiceBasedChannel } from 'discord.js';
import ytdl from 'ytdl-core';

interface Queue {
    gid: string;
    player: AudioPlayer;
    movie: Movie[];
    loop: boolean;
}
interface Movie {
    title: string;
    url: string;
    length: string;
}

export class Music {
    static queue: Queue[];
}

export async function initAudioPlayer(gid: string): Promise<void> {
    const queue = Music.queue.find((q) => q.gid === gid);

    if (!queue) {
        Music.queue.push({ gid, player: createAudioPlayer(), movie: [], loop: false });
    }
}

export async function addQueue(gid: string, url: string, loop?: boolean): Promise<boolean> {
    if (!ytdl.validateURL(url)) {
        return false;
    }

    const queue = Music.queue.find((q) => q.gid === gid);

    const info = await ytdl.getInfo(url);

    if (queue) {
        queue.movie.push({
            title: info.videoDetails.title,
            url: info.videoDetails.video_url,
            length: info.videoDetails.lengthSeconds
        });
        if (loop) {
            queue.loop = true;
        }
    } else {
        Music.queue.push({
            gid,
            player: createAudioPlayer(),
            movie: [
                {
                    title: info.videoDetails.title,
                    url: info.videoDetails.video_url,
                    length: info.videoDetails.lengthSeconds
                }
            ],
            loop: false
        });
    }

    console.log(`add queue: ${gid}/${url}`);
    return true;
}

export async function remove(gid: string, movie: Movie): Promise<boolean> {
    const queue = Music.queue.find((q) => q.gid === gid);

    if (queue) {
        Music.queue.map((q) => {
            if (q.gid === gid) {
                q.movie = q.movie.filter((m) => m.url !== movie.url);
            }
        });
    } else {
        return false;
    }

    console.log(`remove queue: ${gid}/${movie.title}`);
    return true;
}

export async function playMusic(channel: VoiceBasedChannel) {
    const queue = Music.queue.find((q) => q.gid === channel.guild.id);

    if (!queue || queue.movie.length === 0) {
        await stopMusic(channel);
        return;
    }

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

    connection.subscribe(queue.player);

    const stream = ytdl(ytdl.getURLVideoID(queue.movie[0].url), {
        filter: (format) => format.audioCodec === 'opus' && format.container === 'webm', //webm opus
        quality: 'highest',
        highWaterMark: 32 * 1024 * 1024 // https://github.com/fent/node-ytdl-core/issues/902
    });

    const resource = createAudioResource(stream, {
        inputType: StreamType.WebmOpus
    });

    queue.player.play(resource);

    await entersState(queue.player, AudioPlayerStatus.Playing, 10 * 1000);
    await entersState(queue.player, AudioPlayerStatus.Idle, 24 * 60 * 60 * 1000);

    await remove(channel.guild.id, queue.movie[0]);
    await playMusic(channel);
    // connection.destroy();
}

export async function stopMusic(channel: VoiceBasedChannel) {
    const queue = Music.queue.find((q) => q.gid === channel.guild.id);

    if (queue) {
        if (queue.movie.length > 0) {
            await remove(channel.guild.id, queue.movie[0]);
            playMusic(channel);
        } else {
            const connection = getVoiceConnection(channel.guild.id);
            connection?.destroy();
        }
    }
}

export async function extermAudioPlayer(gid: string) {
    const queue = Music.queue.find((q) => q.gid === gid);

    if (queue) {
        Music.queue.map((q) => {
            if (q.gid === gid) {
                q.movie = [];
            }
        });
    }

    const connection = getVoiceConnection(gid);
    connection?.destroy();
}
