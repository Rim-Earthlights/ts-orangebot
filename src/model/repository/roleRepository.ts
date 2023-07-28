import { Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';
import { RoleType } from '../models/role.js';

export class RoleRepository {
    private repository: Repository<Models.Role>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Role);
    }

    public async getRoles(): Promise<Models.Role[]> {
        return await this.repository.find();
    }

    public async getRoleByType(type: RoleType) {
        return await this.repository.findOne({ where: { type } });
    }

    public async getRoleByName(name: string): Promise<Models.Role | null> {
        return await this.repository.findOne({ where: { name } });
    }

    public async addRole(entities: Partial<Models.Role>): Promise<boolean> {
        const result = await this.repository.save(entities);
        return Boolean(result);
    }

    public async deleteRole(name: string): Promise<boolean> {
        const deleted = await this.repository.delete({ name });
        return deleted.affected === 1;
    }
}
