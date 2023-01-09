import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models';
import { TypeOrm } from '../typeorm/typeorm';

export class ItemRepository {
    private itemRepository: Repository<Models.Item>;
    private rankRepository: Repository<Models.ItemRank>;

    constructor() {
        this.itemRepository = TypeOrm.dataSource.getRepository(Models.Item);
        this.rankRepository = TypeOrm.dataSource.getRepository(Models.ItemRank);
    }

    /**
     * アイテムを取得する
     * @param rare レア度
     * @returns Promise<ItemTable[] | null>
     */
    public async get(rare: string): Promise<Models.Item[]> {
        return await this.itemRepository.find({
            relations: {
                item_rank: true
            },
            where: { rare: rare }
        });
    }

    /**
     * 全アイテムを取得する
     * @returns
     */
    public async getAll(): Promise<Models.Item[]> {
        return await this.itemRepository.find({
            relations: {
                item_rank: true
            }
        });
    }

    /**
     * アイテムを登録する
     * @param item
     * @returns
     */
    public async save(item: DeepPartial<Models.Item>): Promise<void> {
        await this.itemRepository.save(item);
    }

    /**
     * アイテムを初期化する
     * @param item
     */
    public async init(item: DeepPartial<Models.Item[]>): Promise<void> {
        const i = await this.getAll();
        if (i.length > 0) {
            return;
        }

        await this.rankRepository.save([
            {
                rare: 'UUR',
                rank: 0
            },
            {
                rare: 'UR',
                rank: 1
            },
            {
                rare: 'SSR',
                rank: 2
            },
            {
                rare: 'SR',
                rank: 3
            },
            {
                rare: 'R',
                rank: 4
            },
            {
                rare: 'UC',
                rank: 5
            },
            {
                rare: 'C',
                rank: 6
            }
        ]);
        await this.itemRepository.save(item);
    }
}
