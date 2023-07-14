import { CategoryChannel, ChannelType, Guild, VoiceChannel, VoiceState } from 'discord.js';
import { DISCORD_CLIENT, EXCLUDE_ROOM } from '../../constant/constants.js';
import { extermAudioPlayer } from './music.js';
import * as logger from '../../common/logger.js';

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
            await logger.put({
                guild_id: vc.guild?.id,
                channel_id: vc.id,
                user_id: undefined,
                level: 'info',
                event: 'vc-left',
                message: `delete ch: ${voiceState.channel?.name}`
            });
            await vc.delete();
        } else {
            const bot = vc.members.filter((m) => m.user.bot);
            if (vc.members.size === bot.size) {
                if (vc.members.find((m) => m.id === DISCORD_CLIENT?.user?.id)) {
                    await extermAudioPlayer(vc.guild.id);
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
        const channelLength = guild.channels.cache.filter((c) => c.name.includes('お部屋:')).size + 1;
        if (parent) {
            const vc = await guild.channels.create({
                name: `お部屋: #${('000' + channelLength).slice(-3)}`,
                type: ChannelType.GuildVoice,
                parent: parent
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
    }
}
