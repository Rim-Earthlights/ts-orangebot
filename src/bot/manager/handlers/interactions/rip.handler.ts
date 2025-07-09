import { ChannelType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { checkUserType } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { Role } from '../../../../constant/chat/chat.js';
import { UsersType } from '../../../../model/models/users.js';
import * as ChatService from '../../../../service/chat.service.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { GuildRepository } from '../../../../model/repository/guildRepository.js';

/**
 * /rip <user>
 * 特定のユーザーを墓へ移動する
 */
export class RipHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const interactionGuild = interaction.guild;
    if (!interactionGuild) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('エラー')
        .setDescription('サーバーが見つかりませんでした。');
      await interaction.reply({ embeds: [errorEmbed] });
      return;
    }

    const interactionUser = interaction.user;
    if (!checkUserType(interactionGuild.id, interactionUser.id, UsersType.ADMIN)) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('エラー')
        .setDescription('このコマンドは管理者のみ使用できます。');
      await interaction.reply({ embeds: [errorEmbed] });
      return;
    }

    if (interaction.channel?.type !== ChannelType.GuildVoice) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('エラー')
        .setDescription('このコマンドはボイスチャンネルでのみ使用できます。');
      await interaction.reply({ embeds: [errorEmbed] });
      return;
    }

    const guildRepository = new GuildRepository();
    const guild = await guildRepository.get(interactionGuild.id);
    if (!guild) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('エラー')
        .setDescription('サーバーが見つかりませんでした。');
      await interaction.reply({ embeds: [errorEmbed] });
      return;
    }

    const ripName = guild.inactive_name;

    const ripChannel = interactionGuild.channels.cache.find(
      (c) => c.name === ripName && c.type === ChannelType.GuildVoice
    );

    if (!ripChannel || ripChannel.type !== ChannelType.GuildVoice) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('エラー')
        .setDescription('墓のチャンネルが見つかりませんでした。');
      await interaction.reply({ embeds: [errorEmbed] });
      return;
    }

    const user = interaction.options.getUser('user')!;
    const member = await interaction.guild.members.fetch(user.id);
    await member.voice.setChannel(ripChannel);

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff55')
      .setTitle('成功')
      .setDescription(`${user.displayName} を墓に送りました`);
    await interaction.reply({ embeds: [successEmbed] });
  }
}
