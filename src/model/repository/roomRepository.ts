import { Repository } from 'typeorm';
import { DISCORD_CLIENT } from '../../constant/constants.js';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';

export class RoomRepository {
  private repository: Repository<Models.Room>;

  constructor() {
    this.repository = TypeOrm.dataSource.getRepository(Models.Room);
  }

  public async init(gid: string): Promise<void> {
    const room = await this.repository.find({ where: { guild_id: gid, is_autodelete: true }});

    room.map(async (r) => {
      try {
        await DISCORD_CLIENT.channels.fetch(r.room_id);
      } catch {
        await this.repository.delete({ room_id: r.room_id });
      }
    });
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
