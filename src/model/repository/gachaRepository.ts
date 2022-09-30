import { Repository } from 'typeorm';
import { GachaTable } from '../models/gacha';
import { TypeOrm } from '../typeorm/typeorm';

export class GachaRepository {
    private repository: Repository<GachaTable>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(GachaTable);
    }

    /**
     * UIDからユーザを取得する.
     * @param uid user.id
     * @returns Promise<Users | null>
     */
    public async getById(uid: string): Promise<GachaTable | null> {
        const user = await this.repository.findOne({ where: { id: uid } });
        return user;
    }
}
