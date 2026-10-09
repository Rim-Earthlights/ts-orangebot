import { CacheType, ChatInputCommandInteraction, ChannelType, MessageFlags } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { checkUserType } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { UsersType } from '@orangebot/shared';
import { acceptMember } from '../../../utils/memberAccept.js';

export class AcceptHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    if (!interaction.guild) {
      return;
    }
    if (!(await checkUserType(interaction.guild.id, interaction.user.id, UsersType.OWNER))) {
      await interaction.reply({ content: 'このコマンドを実行する権限がありません。', flags: MessageFlags.Ephemeral });
      return;
    }
    if (interaction.channel?.type === ChannelType.GuildText || interaction.channel?.type === ChannelType.GuildVoice) {
      const user = interaction.options.getUser('user')!;
      await this.logger?.info(
        'interactions | accept',
        [`user: ${user.displayName}`],
        interaction.guild.id,
        interaction.channel.id,
        user.id
      );

      const u = interaction.guild.members.cache.get(user.id);

      if (!u) {
        console.error('user not found');
        return;
      }

      const result = await acceptMember(u, interaction.channel.id);
      if (result === 'role-not-found') {
        return;
      }

      const name = u.roles.cache.find((role) => role.name === 'member')?.name;
      const message = await interaction.reply({
        content: `add role: ${name}`,
        flags: MessageFlags.Ephemeral,
      });
      setTimeout(async () => {
        await message.delete();
      }, 3000);
      return;
    }
  }
}
