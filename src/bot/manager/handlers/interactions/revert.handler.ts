import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { ChatHistoryRepository } from '../../../../model/repository/chatHistoryRepository.js';
import { getIdInfoInteraction, initalize, LiteLLM, llmList } from '../../../../constant/chat/chat.js';

export class RevertHandler extends BaseInteractionHandler {
  private chatHistoryRepository: ChatHistoryRepository;

  constructor(logger?: Logger) {
    super(logger);
    this.chatHistoryRepository = new ChatHistoryRepository();
  }

  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    try {
      const uuid = interaction.options.getString('uuid');
      const { id, isGuild } = getIdInfoInteraction(interaction);

      if (!id) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('エラー')
          .setDescription('チャンネルIDが見つかりませんでした。');
        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // データベースから最新のチャット履歴を取得
      const latestChatHistory = await this.chatHistoryRepository.getLatestByChannelId(id);

      if (!latestChatHistory) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('エラー')
          .setDescription('このチャンネルのチャット履歴が見つかりませんでした。');

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // llmListから該当するチャットセッションを探す
      let llm: LiteLLM | undefined;
      if (uuid) {
        llm = llmList.llm.find((llm) => llm.uuid === uuid);
      } else {
        llm = llmList.llm.find((llm) => llm.id === id);
      }

      if (llm) {
        // 現在のチャット履歴がある場合は上書きしない
        const warningEmbed = new EmbedBuilder()
          .setColor('#ffaa00')
          .setTitle('履歴が存在する')
          .setDescription('まだチャットが残ってるみたい～！そのまま喋れるよ！');

        await interaction.editReply({ embeds: [warningEmbed] });
        return;
      } else {
        // 現在のチャット履歴がない場合は、DBから取得した履歴で上書きする
        const llm = await initalize(id, latestChatHistory.model, latestChatHistory.mode, isGuild);
        llmList.llm.push({ ...llm, chat: latestChatHistory.content, uuid: latestChatHistory.uuid });
      }

      const successEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('復元完了')
        .setDescription(
          `チャット履歴を復元しました。\n履歴UUID: ${latestChatHistory.uuid}\nメッセージ数: ${latestChatHistory.content.length - 1}`
        );

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      const err = error as Error;
      this.logger?.error('handler | revert', [err.message]);

      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('エラー')
        .setDescription('チャット履歴の復元中にエラーが発生しました。');

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}
