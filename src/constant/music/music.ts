import { AudioPlayer, VoiceConnection } from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';

/**
 * 音楽プレイヤー
 */
export class Music {
    static player: PlayerData[] = [];
}

export interface PlayerData {
    guild_id: string;
    channel: VoiceBasedChannel;
    connection: VoiceConnection;
    player: AudioPlayer;
}
