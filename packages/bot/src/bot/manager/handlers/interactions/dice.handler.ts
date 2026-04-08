import { CacheType, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, VoiceChannel } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import * as BotFunctions from '../../../function/index.js';

export class DiceHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { commandName } = interaction;
    switch (commandName) {
      case 'dice': {
        await this.handleDice(interaction);
        break;
      }
      case 'dall': {
        await this.handleDiceAll(interaction);
        break;
      }
    }
  }

  private async handleDice(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const num = interaction.options.getNumber('num') ?? 1;
    const max = interaction.options.getNumber('max') ?? 100;
    await BotFunctions.Dice.rollHideDice(interaction, num, max);
  }

  private async handleDiceAll(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();
    const voiceChannel = interaction.channel as VoiceChannel;
    if (!voiceChannel) {
      return;
    }
    const members = voiceChannel.members;
    const diceMessages = members.map((member) => {
      return {
        member: member,
        dice: Math.floor(Math.random() * 100) + 1,
      };
    });
    const diceMessage = diceMessages;
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('ダイス結果')
          .setDescription(diceMessage.map((m) => `${m.member.user.displayName}: ${m.dice}`).join('\n')),
      ],
    });
  }
}
