import { Message } from 'discord.js';
import { CommandHandler } from '../../commandSelector.js';

export class ChatCommandHandler implements CommandHandler {
  constructor(private discordMessage: Message) {}

  async execute(args: string[]): Promise<void> {
    this.discordMessage.reply('チャットハンドラーが実行されました ' + args.join(' '));
  }
}
