import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { checkUserType } from '../../../../common/common.js';
import { Logger } from '../../../../common/logger.js';
import { UsersType } from '../../../../model/models/users.js';
import { UsersRepository } from '../../../../model/repository/usersRepository.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';

export class UserTypeHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', ephemeral: true });
      return;
    }

    if (!checkUserType(interaction.guild.id, interaction.user.id, UsersType.OWNER)) {
      await interaction.reply({ content: 'このコマンドを実行する権限がありません。', ephemeral: true });
      return;
    }

    const uid = interaction.options.getString('user_id');
    const type = interaction.options.getString('type') as UsersType | null;

    if (!uid || !type) {
      await interaction.reply({ content: 'ユーザーIDと権限タイプを指定してください。', ephemeral: true });
      return;
    }

    const userRepository = new UsersRepository();
    const user = await userRepository.updateUsersType(interaction.guild.id, uid, type);

    const send = new EmbedBuilder()
      .setColor('#ffcc00')
      .setTitle(`権限変更`)
      .setDescription(`権限を変更: ${user?.user_name} / ${type}`);
      
    await interaction.reply({ embeds: [send] });
  }
}