import { DeepPartial, Repository } from 'typeorm';
import { getDataSource } from '../config/datasource.js';
import * as Models from '../models/index.js';

export class LogRepository {
  private repository: Repository<Models.Log>;

  constructor() {
    this.repository = getDataSource().getRepository(Models.Log);
  }

  /**
   * ログを保存する
   * @param log
   * @returns
   */
  public async save(log: DeepPartial<Models.Log>): Promise<void> {
    await this.repository.save(log);
    return;
  }

  /**
   * ユーザーの最終参加日時を取得する
   * @param guildId
   * @param userId
   * @returns
   */
  public async getLastCallJoinDate(guildId: string, userId: string): Promise<Date | null> {
    const log = await this.repository.findOne({
      where: { guild_id: guildId, user_id: userId, event: 'vc-join' },
      order: { created_at: 'DESC' },
    });
    if (!log) {
      return null;
    }

    return log.created_at;
  }
}
