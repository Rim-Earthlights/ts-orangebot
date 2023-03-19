import { DeepPartial, Repository } from 'typeorm';
import { YoutubePlaylists } from '../../bot/request/youtubeAPI.js';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';
import * as logger from '../../common/logger.js';

export class MusicRepository {
    private repository: Repository<Models.Music>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Music);
    }

    /**
     * 全ての音楽を取得する
     * @param gid
     */
    public async getAll(gid: string): Promise<Models.Music[]> {
        logger.info(gid, `repository/music: getAll`);
        return await this.repository.find({
            where: { guild_id: gid },
            order: { music_id: 'ASC' }
        });
    }

    /**
     * キューの音楽を取得する
     * @param gid
     */
    public async getQueue(gid: string): Promise<Models.Music[]> {
        logger.info(gid, `repository/music: getQueue`);
        return await this.repository.find({
            where: { guild_id: gid, is_play: 0 },
            order: { music_id: 'ASC' }
        });
    }

    /**
     * 音楽を保存する
     */
    public async saveAll(gid: string, musics: Models.Music[]): Promise<Models.Music[]> {
        logger.info(gid, `repository/music: saveAll`);
        await this.remove(gid);
        return await this.repository.save(musics);
    }

    public async save(music: DeepPartial<Models.Music>): Promise<boolean> {
        logger.info(music.guild_id, `repository/music: save`);
        const result = await this.repository.save(music);
        return Boolean(result);
    }

    public async addRange(gid: string, musics: YoutubePlaylists[]): Promise<boolean> {
        logger.info(gid, `repository/music: addAll`);
        let mid = 0;
        const getMusic = await this.repository.findOne({ where: { guild_id: gid }, order: { music_id: 'DESC' } });
        if (getMusic) {
            mid = getMusic.music_id + 1;
        }
        const list = musics.map((m) => {
            return {
                guild_id: gid,
                music_id: mid++,
                title: m.title,
                url: `https://youtube.com/watch?v=${m.videoId}`,
                thumbnail: m.thumbnail
            };
        });
        await this.repository.save(list);
        return true;
    }

    /**
     * 音楽をキューに追加する.
     * @returns Promise<boolean>
     */
    public async add(gid: string, music: DeepPartial<Models.Music>, interrupt: boolean): Promise<boolean> {
        logger.info(gid, `repository/music: add`);
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
        logger.info(gid, 'repository/music: remove', `queue: ${gid}, ${musicId ? musicId : 'all'}`);
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

    public async resetPlayState(gid: string): Promise<boolean> {
        logger.info(gid, 'repository/music: update', `reset playstate.`);
        const result = await this.repository.update({ guild_id: gid }, { is_play: 0 });
        if (result.affected) {
            return true;
        }
        return false;
    }

    public async updatePlayState(gid: string, musicId: number, state: boolean): Promise<boolean> {
        const music = await this.repository.findOne({ where: { guild_id: gid, music_id: musicId } });

        if (!music) {
            return false;
        }

        await this.save({ ...music, is_play: state ? 1 : 0 });
        logger.info(gid, 'repository/music: update', `update playstate: ${music.title} / ${state}`);
        return true;
    }
}
