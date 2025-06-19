import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { UsersRepository } from '../../../../model/repository/usersRepository.js';

export class NicknameHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const name = interaction.options.getString('name');
    if (!name) {
      return;
    }
    if (interaction.guild) {
      const usersRepository = new UsersRepository();
      const user = await usersRepository.get(interaction.guild.id, interaction.user.id);
      if (!user) {
        await interaction.reply({ content: `あなたのことが登録されていないみたい……？` });
        return;
      }
      await usersRepository.save({ ...user, userSetting: { ...user.userSetting, nickname: name } });
      await interaction.reply({ content: `はーい！これから「${name}」って呼ぶね～！` });
    }
  }
}