import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { UsersRepository } from "@orangebot/shared";

export class NicknameHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const name = interaction.options.getString('name');
    if (interaction.guild) {
      const usersRepository = new UsersRepository();
      const user = await usersRepository.get(interaction.guild.id, interaction.user.id);
      if (!user) {
        await interaction.reply({ content: `あなたのことが登録されていないみたい……？` });
        return;
      }
      const nickname = name && name.trim() ? name.trim() : null;
      await usersRepository.save({ ...user, userSetting: { ...user.userSetting, nickname } });
      await interaction.reply({
        content: nickname
          ? `はーい！これから「${nickname}」って呼ぶね～！`
          : `呼び方をリセットしたよ！これからは表示名で呼ぶね～！`,
      });
    }
  }
}
