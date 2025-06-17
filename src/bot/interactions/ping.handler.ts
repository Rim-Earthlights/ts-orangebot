import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { InteractionHandler } from '../manager/interaction.handler.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';

export class PingHandler implements InteractionHandler {
  logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.reply('Pong!');
  }
}
