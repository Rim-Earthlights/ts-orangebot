import { CacheType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';

export let CHAT_PAUSE_FLAGS: string[] = [];

export class PauseHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { commandName } = interaction;
    switch (commandName) {
      case 'pause': {
        await this.handlePauseInteraction(interaction);
        break;
      }
      case 'resume': {
        await this.handleResumeInteraction(interaction);
        break;
      }
    }
  }

  private async handlePauseInteraction(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { channel } = interaction;
    if (!channel) {
      return;
    }
    CHAT_PAUSE_FLAGS.push(channel.id);
    await interaction.reply({ content: 'チャットを一時停止しました' });

    // 10分後に一時停止を解除
    setTimeout(
      () => {
        CHAT_PAUSE_FLAGS = CHAT_PAUSE_FLAGS.filter((id) => id !== channel.id);
      },
      1000 * 60 * 10
    );
  }

  private async handleResumeInteraction(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { channel } = interaction;
    if (!channel) {
      return;
    }
    CHAT_PAUSE_FLAGS = CHAT_PAUSE_FLAGS.filter((id) => id !== channel.id);
    await interaction.reply({ content: 'チャットを再開しました' });
  }
}
