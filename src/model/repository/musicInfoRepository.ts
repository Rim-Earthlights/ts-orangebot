import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models';
import { TypeOrm } from '../typeorm/typeorm';

export class MusicInfoRepository {
    private repository: Repository<Models.MusicInfo>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.MusicInfo);
    }

    public async get(gid: string): Promise<Models.MusicInfo | null> {
        return await this.repository.findOne({ where: { guild_id: gid } });
    }

    public async save(info: DeepPartial<Models.MusicInfo>): Promise<void> {
        await this.repository.save(info);
    }

    public async remove(gid: string): Promise<void> {
        await this.repository.createQueryBuilder().delete().where('guild_id = :gid', { gid: gid }).execute();
    }
}
