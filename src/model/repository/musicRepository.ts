import { DeepPartial, Repository } from 'typeorm';
import { Music } from '../models/music';
import { TypeOrm } from '../typeorm/typeorm';

export class MusicRepository {
    private repository: Repository<Music>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Music);
    }

    /**
     * キューの先頭の音楽を取得する
     * @param gid
     */
    public async getAll(gid: string): Promise<Music[]> {
        return await this.repository.find({ where: { guild_id: gid }, order: { music_id: 'ASC' } });
    }

    /**
     * 音楽をキューに追加する.
     * @returns Promise<GachaTable[] | null>
     */
    public async add(gid: string, music: DeepPartial<Music>, interrupt: boolean): Promise<boolean> {
        if (interrupt) {
            const getMusic = await this.repository.findOne({ where: { guild_id: gid }, order: { music_id: 'ASC' } });
            if (!getMusic) {
                const saveMusic = await this.repository.save({ ...music, music_id: 0 });
                return !!saveMusic;
            }
            const saveMusic = await this.repository.save({ ...music, music_id: getMusic.music_id - 1 });
            return !!saveMusic;
        } else {
            const getMusic = await this.repository.findOne({ where: { guild_id: gid }, order: { music_id: 'DESC' } });
            if (!getMusic) {
                const saveMusic = await this.repository.save({ ...music, music_id: 0 });
                return !!saveMusic;
            }
            const saveMusic = await this.repository.save({ ...music, music_id: getMusic.music_id + 1 });
            return !!saveMusic;
        }
    }

    /**
     * 指定したIDの音楽をキューから削除する
     */
    public async remove(gid: string, musicId?: number): Promise<boolean> {
        let result;
        console.log({ gid, musicId });
        if (musicId !== undefined) {
            result = await this.repository
                .createQueryBuilder()
                .delete()
                .where('guild_id = :gid', { gid: gid })
                .andWhere('music_id = :musicId', { musicId: musicId })
                .execute();
        } else {
            result = await this.repository
                .createQueryBuilder()
                .delete()
                .where('guild_id = :gid', { gid: gid })
                .execute();
        }
        return Boolean(result.affected);
    }
}
