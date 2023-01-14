import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models';
import { TypeOrm } from '../typeorm/typeorm';

export class UsersRepository {
    private repository: Repository<Models.Users>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Users);
    }

    /**
     * UIDからユーザを取得する.
     * @param uid user.id
     * @returns Promise<Users | null>
     */
    public async get(uid: string): Promise<Models.Users | null> {
        const user = await this.repository.findOne({ where: { id: uid } });
        return user;
    }

    /**
     * ユーザを登録・更新する
     * @param user
     * @returns
     */
    public async save(user: DeepPartial<Models.Users>): Promise<void> {
        await this.repository.save(user);
    }

    /**
     * ガチャ回数を10に再セットする
     * @param uid user id
     */
    public async resetGacha(uid: string): Promise<void> {
        await this.repository.save({ id: uid, pick_left: 10 });
    }

    /**
     * ユーザの残りピック数を10増やす
     */
    public async addPickLeft(): Promise<void> {
        const users = await this.repository.find();
        const saveUsers = users.map((u) => {
            return { ...u, pick_left: u.pick_left + 10 };
        });
        await this.repository.save(saveUsers);
    }
}
