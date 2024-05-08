import { CategoryChannel, ChannelType, Guild, VoiceChannel, VoiceState } from 'discord.js';
import { DISCORD_CLIENT, EXCLUDE_ROOM } from '../../constant/constants.js';
import { extermAudioPlayer } from './music.js';
import { RoomRepository } from '../../model/repository/roomRepository.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';
import { UsersRepository } from '../../model/repository/usersRepository.js';

/**
 * ボイスチャンネルから切断した時の処理
 * @param guild サーバ情報
 * @param voiceState VoiceState
 * @returns void
 */
export async function leftVoiceChannel(guild: Guild, userId: string, voiceState: VoiceState): Promise<void> {
    if (EXCLUDE_ROOM.every((r) => r !== voiceState.channel?.name)) {
        const vc = voiceState.channel as VoiceChannel;

        if (vc.members.size <= 0) {
            const room = new RoomRepository();
            const roomInfo = await room.getRoom(vc.id);
            if (!roomInfo || roomInfo.is_autodelete) {
                try {
                    await room.deleteRoom(vc.id);
                    await Logger.put({
                        guild_id: vc.guild?.id,
                        channel_id: vc.id,
                        user_id: undefined,
                        level: LogLevel.INFO,
                        event: 'vc-left',
                        message: [`delete ch: ${voiceState.channel?.name}`]
                    });
                    await vc.delete();
                } catch (e) {
                    const err = e as Error;
                    await Logger.put({
                        guild_id: vc.guild?.id,
                        channel_id: vc.id,
                        user_id: undefined,
                        level: LogLevel.ERROR,
                        event: 'vc-left',
                        message: [`delete ch: ${voiceState.channel?.name}`, err.message]
                    });
                }
            }
        } else {
            const bot = vc.members.filter((m) => m.user.bot);
            if (vc.members.size === bot.size) {
                if (vc.members.find((m) => m.id === DISCORD_CLIENT?.user?.id)) {
                    await extermAudioPlayer(vc.guild.id, vc.id);
                }
            }
        }
    }
}

/**
 * ボイスチャンネルに接続した時の処理
 * @param guild サーバ情報
 * @param voiceState VoiceState
 * @returns void
 */
export async function joinVoiceChannel(guild: Guild, userId: string, voiceState: VoiceState): Promise<void> {
    // joined
    if (voiceState.channel?.name === 'ロビー') {
        // lobby login
        const parent = guild.channels.cache.find((c) => c.parentId != null && c.type === ChannelType.GuildVoice)
            ?.parent as CategoryChannel;
        if (parent) {
            const vc = await guild.channels.create({
                name: getDefaultRoomName(guild),
                type: ChannelType.GuildVoice,
                userLimit: 30,
                parent: parent
            });
            const room = new RoomRepository();
            await room.createRoom({
                room_id: vc.id,
                guild_id: vc.guild.id,
                name: vc.name,
                is_autodelete: true,
                is_live: false,
                is_private: false
            });
            await Logger.put({
                guild_id: vc.guild?.id,
                channel_id: vc.id,
                user_id: undefined,
                level: LogLevel.INFO,
                event: 'vc-join',
                message: [`create ch: ${vc.name}`]
            });
            (voiceState.channel as VoiceChannel).members.map(async (m) => {
                await m.voice.setChannel(vc.id);
            });
        }
    } else {
        if (!voiceState.channel) {
            return;
        }

        const room = new RoomRepository();
        const roomInfo = await room.getRoom(voiceState.channel?.id);
        if (!roomInfo) {
            await Logger.put({
                guild_id: voiceState.channel?.guild?.id,
                channel_id: voiceState.channel?.id,
                user_id: undefined,
                level: LogLevel.INFO,
                event: 'vc-join',
                message: [`re-create ch: ${voiceState.channel?.name}`]
            });
            await room.createRoom({
                room_id: voiceState.channel.id,
                guild_id: voiceState.guild.id,
                name: voiceState.channel.name,
                is_autodelete: true,
                is_live: false,
                is_private: false
            });
        }
    }
    const userRepository = new UsersRepository();

    const user = await userRepository.get(userId);

    if (!user) {
        return;
    } else {
        if (user.voice_channel_data) {
            const vd = user.voice_channel_data.find((v) => v.gid === voiceState.guild.id);
            if (vd) {
                vd.date = new Date();
            } else {
                user.voice_channel_data.push({
                    gid: voiceState.guild.id,
                    date: new Date()
                });
            }
            await userRepository.save(user);
        } else {
            user.voice_channel_data = [
                {
                    gid: voiceState.guild.id,
                    date: new Date()
                }
            ];
            await userRepository.save(user);
        }
    }
}

/**
 * ボイスチャンネルの名前を取得する
 * @param guild
 * @returns
 */
export function getDefaultRoomName(guild: Guild): string {
    const rooms = guild.channels.cache.filter((c) => c.name.includes('お部屋:'));
    if (rooms.size > 0) {
        const channelLength =
            guild.channels.cache
                .filter((c) => c.name.includes('お部屋: #'))
                .map((c) => Number(c.name.replace('お部屋: #', '')))
                .sort((a, b) => b - a)[0] + 1;
        return `お部屋: #${('000' + channelLength).slice(-3)}`;
    }
    return `お部屋: #001`;
}
