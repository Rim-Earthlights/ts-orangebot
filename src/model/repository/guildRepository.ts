import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';

export class GuildRepository {
  private repository: Repository<Models.Guild>;

  constructor() {
    this.repository = TypeOrm.dataSource.getRepository(Models.Guild);
  }

  /**
   * GIDからGuildを取得する
   * @param gid guild.id
   * @returns Promise<Models.Guild | null>
   */
  public async get(gid: string): Promise<Models.Guild | null> {
    const guild = await this.repository.findOne({ where: { id: gid } });
    return guild;
  }

  /**
   * botの登録されている全てのGuildを取得する
   * @returns
   */
  public async getAll(): Promise<Models.Guild[]> {
    const guilds = await this.repository.find();
    return guilds;
  }

  /**
   * Guildを登録・更新する
   * @param user
   * @returns
   */
  public async save(user: DeepPartial<Models.Guild>): Promise<void> {
    await this.repository.save(user);
  }
}
