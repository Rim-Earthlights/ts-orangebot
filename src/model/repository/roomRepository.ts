import { Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';

export class RoomRepository {
    private repository: Repository<Models.Room>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Room);
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