import { Repository } from 'typeorm';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';

export class SpeakerRepository {
    private repository: Repository<Models.Speaker>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Speaker);
    }

    /**
     * 使われていない読み上げbotを取得する
     * @param gid
     * @returns
     */
    public async getUnusedSpeaker(gid: string): Promise<Models.Speaker | null> {
        return await this.repository.findOne({ where: { guild_id: gid, is_used: 0 }, order: { user_id: 'ASC' } });
    }

    /**
     * 指定された読み上げbotを取得する
     * @param gid
     * @returns
     */
    public async getSpeaker(gid: string, uid: string): Promise<Models.Speaker | null> {
        return await this.repository.findOne({ where: { guild_id: gid, user_id: uid }, order: { user_id: 'ASC' } });
    }

    /**
     * 読み上げbotの使用状況を更新する
     * @param guildId
     * @returns
     */
    public async updateUsedSpeaker(gid: string, uid: string, used: boolean): Promise<boolean> {
        const speaker = await this.repository.findOne({ where: { guild_id: gid, user_id: uid } });
        if (speaker) {
            speaker.is_used = used ? 1 : 0;
            await this.repository.save(speaker);
            return true;
        }
        return false;
    }
}
