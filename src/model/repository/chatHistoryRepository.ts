import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';

export class ChatHistoryRepository {
  private repository: Repository<Models.ChatHistory>;

  constructor() {
    this.repository = TypeOrm.dataSource.getRepository(Models.ChatHistory);
  }

  /**
   * UUIDからチャット履歴を取得する
   * @param uuid チャット履歴のUUID
   * @returns Promise<ChatHistory | null>
   */
  public async get(uuid: string): Promise<Models.ChatHistory | null> {
    const chatHistory = await this.repository.findOne({ where: { uuid } });
    return chatHistory;
  }

  /**
   * チャンネルIDからチャット履歴を取得する
   * @param channelId チャンネルID
   * @returns Promise<ChatHistory[]>
   */
  public async getLatestByChannelId(channelId: string): Promise<Models.ChatHistory | null> {
    const chatHistory = await this.repository.findOne({
      where: { channel_id: channelId },
      order: { created_at: 'DESC' },
    });
    return chatHistory;
  }

  /**
   * チャット履歴を保存・更新する（upsert）
   * @param chatHistory チャット履歴データ
   * @returns Promise<void>
   */
  public async save(chatHistory: DeepPartial<Models.ChatHistory>): Promise<void> {
    await this.repository.save(chatHistory);
  }

  /**
   * UUIDをキーにしてcontentを上書き保存する
   * @param uuid チャット履歴のUUID
   * @param content 新しいコンテンツ
   * @returns Promise<void>
   */
  public async upsertByUuid(uuid: string, content: Models.ChatHistory['content']): Promise<void> {
    const existingChatHistory = await this.get(uuid);

    if (existingChatHistory) {
      // 既存のレコードがある場合は content を更新
      await this.repository.save({
        uuid,
        content,
      });
    } else {
      // 既存のレコードがない場合はエラーを投げる（UUIDが存在しない）
      throw new Error(`ChatHistory with UUID ${uuid} not found`);
    }
  }

  /**
   * チャット履歴を削除する（ソフトデリート）
   * @param uuid チャット履歴のUUID
   * @returns Promise<void>
   */
  public async delete(uuid: string): Promise<void> {
    await this.repository.softDelete({ uuid });
  }

  /**
   * チャット履歴を完全に削除する
   * @param uuid チャット履歴のUUID
   * @returns Promise<void>
   */
  public async hardDelete(uuid: string): Promise<void> {
    await this.repository.delete({ uuid });
  }
}
