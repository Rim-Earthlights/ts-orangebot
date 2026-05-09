import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { getDataSource } from '../config/datasource.js';

export class MusicInfoRepository {
  private repository: Repository<Models.MusicInfo>;

  constructor() {
    this.repository = getDataSource().getRepository(Models.MusicInfo);
  }

  public async get(gid: string, cid: string): Promise<Models.MusicInfo | null> {
    return await this.repository.findOne({ where: { guild_id: gid, channel_id: cid } });
  }

  public async save(info: DeepPartial<Models.MusicInfo>): Promise<void> {
    await this.repository.save(info);
  }

  public async remove(gid: string, cid: string): Promise<boolean> {
    const deleted = await this.repository.delete({ guild_id: gid, channel_id: cid });
    return deleted.affected === 1;
  }
}
