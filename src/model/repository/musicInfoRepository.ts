import { Repository } from 'typeorm';
import { MusicInfo } from '../models/musicInfo';
import { TypeOrm } from '../typeorm/typeorm';
import { MusicRepository } from './musicRepository';

const PLAYED_STATUS = {
    NOT_PLAYED: 0,
    PLAYED: 1
};

export class MusicInfoRepository {
    private repository: Repository<MusicInfo>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(MusicInfo);
    }

    public async get(gid: string): Promise<MusicInfo | null> {
        return await this.repository.findOne({ where: { guild_id: gid } });
    }

    public async save(gid: string, isShuffle: boolean, isLoop: boolean): Promise<void> {
        await this.repository.save({
            guild_id: gid,
            is_shuffle: Boolean(isShuffle),
            is_loop: Boolean(isLoop),
            index: 0
        });
    }

    public async next(gid: string): Promise<void> {
        const musicRepository = new MusicRepository();
        const musics = await musicRepository.getAll(gid);

        const info = await this.repository.findOne({ where: { guild_id: gid } });

        if (!info) {
            return;
        }

        const music = musics.find((m) => m.music_id > info.index);

        if (music) {
            await this.repository.save({
                guild_id: gid,
                index: music.music_id
            });
        } else {
            await this.repository.save({
                guild_id: gid,
                index: 0
            });
        }
    }

    public async remove(gid: string): Promise<void> {
        await this.repository.createQueryBuilder().delete().where('guild_id = :gid', { gid: gid }).execute();
    }
}
