import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models';
import { TypeOrm } from '../typeorm/typeorm';

export class ItemRepository {
    private repository: Repository<Models.Item>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Item);
    }

    /**
     * アイテムを取得する
     * @param rare レア度
     * @returns Promise<ItemTable[] | null>
     */
    public async get(rare: string): Promise<Models.Item[]> {
        return await this.repository.find({
            where: { rare: rare }
        });
    }

    /**
     * アイテムを登録する
     * @param item
     * @returns
     */
    public async save(item: DeepPartial<Models.Item>): Promise<void> {
        await this.repository.save(item);
    }
}
