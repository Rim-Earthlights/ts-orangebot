import { DeepPartial, Repository } from 'typeorm';
import { TypeOrm } from '../typeorm/typeorm.js';
import * as Models from '../models/index.js';

export class LogRepository {
    private repository: Repository<Models.Log>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Log);
    }

    /**
     * ログを保存する
     * @param log
     * @returns
     */
    public async save(log: DeepPartial<Models.Log>): Promise<void> {
        await this.repository.save(log);
        return;
    }
}
