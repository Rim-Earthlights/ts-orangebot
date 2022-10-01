import { DeepPartial, Repository } from 'typeorm';
import { GachaTable } from '../models/gacha';
import { TypeOrm } from '../typeorm/typeorm';

export class GachaRepository {
    private repository: Repository<GachaTable>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(GachaTable);
    }

    /**
     * ガチャ履歴を取得する.
     * @param uid user.id
     * @param date datetime
     * @param limit limit
     * @returns Promise<GachaTable[] | null>
     */
    public async get(uid: string, date?: Date, limit?: number): Promise<GachaTable[] | null> {
        const gacha = this.repository.createQueryBuilder();
        gacha.where('user_id = :id', { id: uid });

        if (date) {
            gacha.andWhere('gachaTime >= :date', { date: date });
        }

        gacha.orderBy('gachaTime', 'DESC');

        gacha.limit(limit ? limit : 100);

        return (await gacha.getMany()) as GachaTable[];
    }

    /**
     * 引いたガチャを保存する
     * @param gacha
     */
    public async save(gacha: DeepPartial<GachaTable>[]): Promise<void> {
        await this.repository.save(gacha);
    }
}
