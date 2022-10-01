import { CategoryChannel, Guild, VoiceChannel, VoiceState } from 'discord.js';
import { ChannelTypes } from 'discord.js/typings/enums';
import { DISCORD_CLIENT, EXCLUDE_ROOM } from '../../constant/constants';
import { extermAudioPlayer, initAudioPlayer } from './music';

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
            await guild?.channels.delete(vc);
            console.log(`delete voice channel: ${voiceState.channel?.id}`);
        } else if (vc.members.size === 1 && vc.members.find((m) => m.id === DISCORD_CLIENT?.user?.id)) {
            await extermAudioPlayer(guild.id);
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
        const parent = guild.channels.cache.find((c) => c.parentId != null && c.isVoice())?.parent as CategoryChannel;
        const channelLength = guild.channels.cache.filter((c) => c.name.includes('お部屋:')).size + 1;
        if (parent) {
            const vc = await guild.channels.create(`お部屋: #${('000' + channelLength).slice(-3)}`, {
                type: ChannelTypes.GUILD_VOICE,
                parent: parent
            });
            (voiceState.channel as VoiceChannel).members.map((m) => {
                m.voice.setChannel(vc.id);
            });
            await initAudioPlayer(guild.id);
        }
    }
}
