import { AudioPlayer } from '@discordjs/voice';

export class Music {
    static player: { id: string; player: AudioPlayer }[] = [];
}
