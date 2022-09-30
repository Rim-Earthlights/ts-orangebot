import { Repository } from 'typeorm';
import { Users } from '../models/users';
import { TypeOrm } from '../typeorm/typeorm';

export class UsersRepository {
    private repository: Repository<Users>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Users);
    }

    /**
     * UIDからユーザを取得する.
     * @param uid user.id
     * @returns Promise<Users | null>
     */
    public async getById(uid: string): Promise<Users | null> {
        const user = await this.repository.findOne({ where: { id: uid } });
        return user;
    }
}
