import { Message } from 'discord.js';
import { ChatCommandHandler, GachaCommandHandler } from './handlers/commands/index.js';

export interface CommandHandler {
  execute(args: string[]): Promise<void>;
}

export class CommandSelector {
  private handlers: Map<string, CommandHandler> = new Map();
  private discordMessage: Message;

  constructor(discordMessage: Message) {
    this.discordMessage = discordMessage;
    this.handlers.set('chat', new ChatCommandHandler(discordMessage));
    // alias gacha
    this.handlers.set('g', new GachaCommandHandler(discordMessage));
    this.handlers.set('gacha', new GachaCommandHandler(discordMessage));
  }

  async executeCommand(commandName: string, args: string[]): Promise<void> {
    const handler = this.handlers.get(commandName);

    if (!handler) {
      this.discordMessage.reply(`エラー: コマンド "${commandName}" は存在しません`);
      return;
    }

    await handler.execute(args);
  }
}
