import { DeepPartial, Repository } from 'typeorm';
import * as Models from '../models';
import { TypeOrm } from '../typeorm/typeorm';

export class MusicRepository {
    private repository: Repository<Models.Music>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Music);
    }

    /**
     * キューの音楽を取得する
     * @param gid
     */
    public async getAll(gid: string): Promise<Models.Music[]> {
        return await this.repository.find({
            where: { guild_id: gid },
            order: { music_id: 'ASC' }
        });
    }

    /**
     * 音楽を保存する
     */
    public async saveAll(gid: string, musics: Models.Music[]): Promise<Models.Music[]> {
        await this.remove(gid);
        return await this.repository.save(musics);
    }

    public async save(music: Models.Music): Promise<boolean> {
        const result = await this.repository.save(music);
        return Boolean(result);
    }

    /**
     * 音楽をキューに追加する.
     * @returns Promise<boolean>
     */
    public async add(gid: string, music: DeepPartial<Models.Music>, interrupt: boolean): Promise<boolean> {
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
