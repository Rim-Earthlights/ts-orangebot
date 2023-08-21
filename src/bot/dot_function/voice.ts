import { CategoryChannel, ChannelType, Guild, VoiceChannel, VoiceState } from 'discord.js';
import { DISCORD_CLIENT, EXCLUDE_ROOM } from '../../constant/constants.js';
import { extermAudioPlayer } from './music.js';
import * as logger from '../../common/logger.js';
import { RoomRepository } from '../../model/repository/roomRepository.js';

/**
 * ボイスチャンネルから切断した時の処理
 * @param guild サーバ情報
 * @param voiceState VoiceState
 * @returns void
 */
export async function leftVoiceChannel(guild: Guild, voiceState: VoiceState): Promise<void> {
    if (EXCLUDE_ROOM.every((r) => r !== voiceState.channel?.name)) {
        const vc = voiceState.channel as VoiceChannel;

        if (vc.members.size <= 0) {
            const room = new RoomRepository();
            const roomInfo = await room.getRoom(vc.id);
            if (!roomInfo || roomInfo.is_autodelete) {
                await room.deleteRoom(vc.id);
                await logger.put({
                    guild_id: vc.guild?.id,
                    channel_id: vc.id,
                    user_id: undefined,
                    level: 'info',
                    event: 'vc-left',
                    message: `delete ch: ${voiceState.channel?.name}`
                });
                await vc.delete();
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
export async function joinVoiceChannel(guild: Guild, voiceState: VoiceState): Promise<void> {
    // joined
    if (voiceState.channel?.name === 'ロビー') {
        // lobby login
        const parent = guild.channels.cache.find((c) => c.parentId != null && c.type === ChannelType.GuildVoice)
            ?.parent as CategoryChannel;
        if (parent) {
            const vc = await guild.channels.create({
                name: getDefaultRoomName(guild),
                type: ChannelType.GuildVoice,
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
            await logger.put({
                guild_id: vc.guild?.id,
                channel_id: vc.id,
                user_id: undefined,
                level: 'info',
                event: 'vc-join',
                message: `create ch: ${vc.name}`
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
            await logger.put({
                guild_id: voiceState.channel?.guild?.id,
                channel_id: voiceState.channel?.id,
                user_id: undefined,
                level: 'info',
                event: 'vc-join',
                message: `re-create ch: ${voiceState.channel?.name}`
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
