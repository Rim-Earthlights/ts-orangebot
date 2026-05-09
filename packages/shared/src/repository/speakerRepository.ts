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
}
