import { CacheType, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { LogLevel } from '../../../../type/types.js';
import { getIntArray, getRndNumber } from '../../../../common/common.js';
import { ITO_TOPICS } from '../../../../constant/words/ito.js';

export class ItoHandler extends BaseInteractionHandler {
  private static ITO_NUMS = getIntArray(100);

  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const { commandName } = interaction;

    switch (commandName) {
      case 'genito': {
        await this.handleGenitoCommand(interaction);
        break;
      }
      case 'ito': {
        await this.handleItoCommand(interaction);
        break;
      }
    }
  }

  private async handleGenitoCommand(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();
    ItoHandler.ITO_NUMS = getIntArray(100);
    const nums = [];
    for (let i = 0; i < 4; i++) {
      const num = getRndNumber(0, ITO_TOPICS.length - 1);
      nums.push(num);
    }
    const send = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`今回のお題は？`)
      .setDescription(nums.map((num) => ITO_TOPICS[num]).join('\n'));

    interaction.editReply({ embeds: [send] });
  }

  private async handleItoCommand(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const round = interaction.options.getNumber('round') ?? 1;
    // roundの数だけ取り出す
    const sendNums = ItoHandler.ITO_NUMS.slice(0, round);
    ItoHandler.ITO_NUMS.splice(0, round);

    await Logger.put({
      guild_id: interaction.guild?.id,
      channel_id: interaction.channel?.id,
      user_id: interaction.user.id,
      level: LogLevel.INFO,
      event: 'received-command/ito',
      message: [`${sendNums.join(', ')}`],
    });

    interaction.editReply({ content: `貴方の数は${sendNums.join(', ')}です.` });
  }
}