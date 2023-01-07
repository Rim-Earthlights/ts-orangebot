import { DeepPartial, Like, MoreThanOrEqual, Repository } from 'typeorm';
import * as Models from '../models';
import { TypeOrm } from '../typeorm/typeorm';

export class GachaRepository {
    private repository: Repository<Models.Gacha>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Gacha);
    }

    /**
     * ガチャ履歴を取得する.
     * @param uid user.id
     * @param date datetime
     * @param limit limit
     * @returns Promise<GachaTable[] | null>
     */
    public async getHistory(uid: string, date?: Date, limit?: number): Promise<Models.Gacha[] | null> {
        if (date) {
            return await this.repository.find({
                relations: ['item'],
                where: { user_id: uid, pick_date: MoreThanOrEqual(date) },
                order: { pick_date: 'DESC' },
                take: limit ? limit : 100
            });
        }

        return await this.repository.find({
            relations: ['item'],
            where: { user_id: uid },
            order: { pick_date: 'DESC' },
            take: limit ? limit : 100
        });
    }

    /**
     * 引いたガチャを保存する
     * @param gacha
     */
    public async save(gacha: DeepPartial<Models.Gacha>[]): Promise<void> {
        await this.repository.save(gacha);
    }

    /**
     * プレゼントを取得する
     * @param uid ユーザID
     * @returns Gacha[]
     */
    public async getPresents(uid: string): Promise<Models.Gacha[]> {
        const gachaList = await this.repository.find({
            where: { user_id: uid, items: { is_present: 1 }, is_used: 0 }
        });
        return gachaList;
    }

    /**
     * プレゼントを使用する
     * @param id ガチャID
     */
    public async usePresent(id: number): Promise<void> {
        const gacha = await this.repository.findOne({ where: { id: id } });
        if (gacha) {
            gacha.is_used = 1;
            await this.repository.save(gacha);
        }
    }
}
