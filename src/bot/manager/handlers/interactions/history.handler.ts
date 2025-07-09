import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { getIdInfoInteraction } from '../../../../constant/chat/chat.js';
import { CONFIG } from '../../../../config/config.js';

export class HistoryHandler extends BaseInteractionHandler {
  constructor(logger?: Logger) {
    super(logger);
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    try {
      const { id } = getIdInfoInteraction(interaction);

      if (!id) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('エラー')
          .setDescription('チャンネルIDが見つかりませんでした。');
        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // チャット履歴のURLを生成
      const historyUrl = `${CONFIG.COMMON.HOST_URL}/chat/history?channel_id=${id}`;

      const successEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('チャット履歴')
        .setDescription(`チャット履歴を開くよ～！`)
        .addFields({
          name: '履歴URL',
          value: `[チャット履歴を開く](${historyUrl})`,
          inline: false,
        })
        .setFooter({
          text: 'ブラウザで開くとチャット履歴が見れるよ！',
        });

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      const err = error as Error;
      this.logger?.error('handler | history', [err.message]);

      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('エラー')
        .setDescription('チャット履歴の取得中にエラーが発生しました。');

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}
