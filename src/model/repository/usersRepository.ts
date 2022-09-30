import { DeepPartial, Repository } from 'typeorm';
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
    public async get(uid: string): Promise<Users | null> {
        const user = await this.repository.findOne({ where: { id: uid } });
        return user;
    }

    /**
     * ユーザを登録・更新する
     * @param user
     * @returns
     */
    public async save(user: DeepPartial<Users>): Promise<void> {
        await this.repository.save(user);
    }

    /**
     * ガチャ日をリセットする
     * @param uid user id
     */
    public async resetGacha(uid: string): Promise<void> {
        await this.repository.save({ id: uid, gachaDate: null });
    }
}
