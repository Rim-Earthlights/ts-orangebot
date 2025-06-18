import { BaseGuildVoiceChannel, ChannelType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { checkUserType } from '../../common/common.js';
import { Logger } from '../../common/logger.js';
import { UsersType } from '../../model/models/users.js';
import { LogLevel } from '../../type/types.js';
import { InteractionHandler } from '../manager/interaction.handler.js';

/**
 * /dc
 * 特定のユーザーをボイスチャンネルから切断する
 */
export class DcHandler implements InteractionHandler {
  logger = new Logger();

  constructor() {
    this.logger = new Logger();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user')!;
    if (!interaction.guild) {
      return;
    }
    if (!checkUserType(interaction.guild.id, interaction.user.id, UsersType.ADMIN)) {
      const send = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`エラー`)
        .setDescription(`このコマンドは管理者のみ使用できます。`);

      interaction.reply({ embeds: [send] });
      return;
    }
    const id = user.id;
    if (!id) {
      const send = new EmbedBuilder().setColor('#ff0000').setTitle(`エラー`).setDescription(`id not found or invalid`);

      interaction.reply({ embeds: [send] });
      return;
    }

    if (interaction.channel?.type === ChannelType.GuildVoice) {
      const channel = interaction.channel as BaseGuildVoiceChannel;
      const member = channel.members.find((member) => member.id === id);
      if (!member) {
        const send = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`エラー`)
          .setDescription(`id not found or invalid`);

        interaction.reply({ embeds: [send] });
        return;
      }
      await member.voice.disconnect();

      await Logger.put({
        guild_id: interaction.guild?.id,
        channel_id: interaction.channel?.id,
        user_id: interaction.user.id,
        level: LogLevel.INFO,
        event: 'disconnect-user',
        message: [`disconnect ${member.user.displayName} by ${interaction.user}`],
      });

      const send = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`成功`)
        .setDescription(`${member.user.displayName}を切断しました`);

      interaction.reply({ embeds: [send] });
    }
  }
}
