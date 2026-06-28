import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseInteractionHandler } from '../../interaction.handler.js';
import { Logger } from '../../../../common/logger.js';
import { ChatHistory, ChatHistoryRepository, ChatSession, countNonSystemMessages } from '@orangebot/shared';
import { DISCORD_CLIENT } from '../../../../constant/constants.js';
import { getIdInfoInteraction } from '../../../../constant/chat/chat.js';
import { createChatService } from '../../../adapters/chat.adapter.js';

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

      let chatHistory: ChatHistory | null = null;

      if (uuid) {
        chatHistory = await this.chatHistoryRepository.get(uuid);
      } else {
        // データベースから最新のチャット履歴を取得
        const botId = DISCORD_CLIENT.user?.id;
        if (botId) {
          chatHistory = await this.chatHistoryRepository.getLatestByChannelId(id, botId);
        }
      }

      if (!chatHistory) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('エラー')
          .setDescription('チャット履歴が見つかりませんでした。');
        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // セッションストアから該当するチャットセッションを探す
      const chatService = createChatService();
      let llm: ChatSession | undefined;
      if (uuid) {
        llm = chatService.getSessionByUuid(uuid);
      } else {
        llm = chatService.getSession(id);
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
        chatService.restoreSession(
          id,
          {
            uuid: chatHistory.uuid,
            chat: chatHistory.content,
            model: chatHistory.model,
            mode: chatHistory.mode,
          },
          isGuild
        );
      }

      const successEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('復元完了')
        .setDescription(
          `チャット履歴を復元しました。\n履歴UUID: ${chatHistory.uuid}\nメッセージ数: ${countNonSystemMessages(chatHistory.content)}`
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
