import { CategoryChannel, Guild, VoiceChannel, VoiceState } from 'discord.js';
import { ChannelTypes } from 'discord.js/typings/enums';

/**
 * ボイスチャンネルから切断した時の処理
 * @param guild サーバ情報
 * @param voiceState VoiceState
 * @returns void
 */
export async function leftVoiceChannel(guild: Guild, voiceState: VoiceState): Promise<void> {
    if (voiceState.channel?.name !== 'ロビー') {
        if ((voiceState.channel as VoiceChannel).members.size <= 0) {
            guild?.channels.delete(voiceState.channel as VoiceChannel);
        }
        console.log(`delete voice channel: ${voiceState.channel?.id}`);
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
            const vc = await guild.channels.create(`お部屋: #00${channelLength}号室`, {
                type: ChannelTypes.GUILD_VOICE,
                parent: parent
            });
            (voiceState.channel as VoiceChannel).members.map((m) => {
                m.voice.setChannel(vc.id);
            });
        }
    }
}
