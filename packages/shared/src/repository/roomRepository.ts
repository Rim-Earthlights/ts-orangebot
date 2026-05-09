import { Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { getDataSource } from '../config/datasource.js';

export class RoomRepository {
  private repository: Repository<Models.Room>;

  constructor() {
    this.repository = getDataSource().getRepository(Models.Room);
  }

  /**
   * 自動削除対象のルームを取得する。
   * 呼び出し側で実体 (Discord チャンネル等) の存在確認を行い、孤児であれば deleteRoom を呼び出す。
   */
  public async getAutodeleteRooms(gid: string): Promise<Models.Room[]> {
    return await this.repository.find({ where: { guild_id: gid, is_autodelete: true } });
  }

  public async getRoom(rid: string): Promise<Models.Room | null> {
    return await this.repository.findOne({ where: { room_id: rid } });
  }

  public async createRoom(entities: Partial<Models.Room>) {
    const result = await this.repository.save(entities);
    return Boolean(result);
  }

  public async updateRoom(rid: string, entity: Partial<Models.Room>) {
    const result = await this.repository.save({ ...entity, room_id: rid });
    return Boolean(result);
  }

  public async deleteRoom(rid: string): Promise<boolean> {
    const deleted = await this.repository.delete({ room_id: rid });
    return deleted.affected === 1;
  }
}
