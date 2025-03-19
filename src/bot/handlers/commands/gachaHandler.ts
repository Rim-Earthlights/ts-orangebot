import { Message } from 'discord.js';
import { CommandHandler } from '../../commandSelector';

export class GachaCommandHandler implements CommandHandler {
  constructor(private discordMessage: Message) {}

  async execute(args: string[]): Promise<void> {
    this.discordMessage.reply('ガチャハンドラーが実行されました ' + args.join(' '));
  }
}
