import { CacheType, ChatInputCommandInteraction } from 'discord.js';

export interface InteractionHandler {
  execute(args: string[]): Promise<void>;
}

export class InteractionSelector {
  private handlers: Map<string, InteractionHandler> = new Map();
  private discordInteraction: ChatInputCommandInteraction<CacheType>;

  constructor(discordInteraction: ChatInputCommandInteraction<CacheType>) {
    this.discordInteraction = discordInteraction;
  }

  executeInteraction(interactionName: string, args: string[]): void {
    const handler = this.handlers.get(interactionName);

    if (!handler) {
      this.discordInteraction.reply(`エラー: コマンド "${interactionName}" は存在しません`);
      return;
    }

    handler.execute(args);
  }
}
