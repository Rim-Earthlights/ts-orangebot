import { Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';

export class ColorRepository {
  private repository: Repository<Models.Color>;

  constructor() {
    this.repository = TypeOrm.dataSource.getRepository(Models.Color);
  }

  /**
   * 色情報を取得する
   * @returns
   */
  public async getColors(): Promise<Models.Color[]> {
    return await this.repository.find();
  }

  /**
   * 色情報を追加する
   * @param entities 追加する色情報
   * @returns
   */
  public async addColor(entities: Partial<Models.Color>): Promise<boolean> {
    const result = await this.repository.save(entities);
    return Boolean(result);
  }

  /**
   * 色情報を削除する
   * @param name 削除する色情報名
   * @returns
   */
  public async deleteColor(name: string): Promise<boolean> {
    const deleted = await this.repository.delete({ color_name: name });
    return deleted.affected === 1;
  }
}
