import { Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';
import { RoleType } from '../models/role.js';

export class RoleRepository {
    private repository: Repository<Models.Role>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Role);
    }

    public async getRoles(gid: string): Promise<Models.Role[]> {
        return await this.repository.find({ where: { guild_id: gid } });
    }

    public async getRoleByType(gid: string, type: RoleType) {
        return await this.repository.findOne({ where: { guild_id: gid, type } });
    }

    public async getRoleByName(gid: string, name: string): Promise<Models.Role | null> {
        return await this.repository.findOne({ where: { guild_id: gid, name } });
    }

    public async addRole(entities: Partial<Models.Role>): Promise<boolean> {
        const result = await this.repository.save(entities);
        return Boolean(result);
    }

    public async deleteRole(gid: string, name: string): Promise<boolean> {
        const deleted = await this.repository.delete({ guild_id: gid, name });
        return deleted.affected === 1;
    }
}
