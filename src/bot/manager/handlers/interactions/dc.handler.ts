import { BaseGuildVoiceChannel, ChannelType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { checkUserType } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { UsersType } from '../../../../model/models/users.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';

/**
 * /dc
 * 特定のユーザーをボイスチャンネルから切断する
 */
export class DcHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
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

      await this.logger.info(
        'disconnect-user',
        [`disconnect ${member.user.displayName} by ${interaction.user}`],
        interaction.guild?.id,
        interaction.channel?.id,
        interaction.user.id
      );

      const send = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`成功`)
        .setDescription(`${member.user.displayName}を切断しました`);

      interaction.reply({ embeds: [send] });
    }
  }
}
