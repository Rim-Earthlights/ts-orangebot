import { Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { getDataSource } from '../config/datasource.js';

export class SpeakerRepository {
  private repository: Repository<Models.Speaker>;

  constructor() {
    this.repository = getDataSource().getRepository(Models.Speaker);
  }

  /**
   * 指定されたサーバーの読み上げボットを取得する
   * @param gid サーバーID
   * @returns 読み上げボットの配列
   */
  async getSpeakers(gid: string): Promise<Models.Speaker[]> {
    return await this.repository.find({ where: { guild_id: gid } });
  }

  /**
   * 指定された読み上げbotが利用されているか確認する
   * 未登録の場合は登録して未使用として扱う
   * @param gid サーバーID
   * @param botUserId 読み上げbotのユーザーID
   * @returns 使用中なら true
   */
  async getStatus(gid: string, botUserId: string): Promise<boolean> {
    const speaker = await this.repository.findOne({ where: { guild_id: gid, user_id: botUserId } });
    if (!speaker) {
      await this.registerSpeaker(gid, botUserId);
      return false;
    }
    return speaker.is_used === 1;
  }

  /**
   * 使われていない読み上げbotを取得する
   * @param gid サーバーID
   */
  async getUnusedSpeaker(gid: string): Promise<Models.Speaker | null> {
    return await this.repository.findOne({ where: { guild_id: gid, is_used: 0 }, order: { user_id: 'ASC' } });
  }

  /**
   * 指定された読み上げbotを取得する
   * @param gid サーバーID
   * @param uid 読み上げbotのユーザーID
   */
  async getSpeaker(gid: string, uid: string): Promise<Models.Speaker | null> {
    return await this.repository.findOne({ where: { guild_id: gid, user_id: uid }, order: { user_id: 'ASC' } });
  }

  /**
   * 読み上げbotを未使用状態で登録する
   * @param gid サーバーID
   * @param uid 読み上げbotのユーザーID
   */
  async registerSpeaker(gid: string, uid: string): Promise<boolean> {
    const speaker = await this.repository.findOne({ where: { guild_id: gid, user_id: uid } });
    try {
      if (!speaker) {
        const newSpeaker = new Models.Speaker();
        newSpeaker.guild_id = gid;
        newSpeaker.user_id = uid;
        newSpeaker.is_used = 0;
        await this.repository.save(newSpeaker);
        return true;
      } else {
        speaker.is_used = 0;
        await this.repository.save(speaker);
        return true;
      }
    } catch (err) {
      return false;
    }
  }

  /**
   * 読み上げbotの使用状況を更新する
   * @param gid サーバーID
   * @param uid 読み上げbotのユーザーID
   * @param used 使用中かどうか
   */
  async updateUsedSpeaker(gid: string, uid: string, used: boolean): Promise<boolean> {
    const speaker = await this.repository.findOne({ where: { guild_id: gid, user_id: uid } });
    if (speaker) {
      speaker.is_used = used ? 1 : 0;
      await this.repository.save(speaker);
      return true;
    }
    return false;
  }
}
