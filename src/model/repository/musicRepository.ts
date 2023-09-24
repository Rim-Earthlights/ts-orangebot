import { DeepPartial, Repository } from 'typeorm';
import { YoutubePlaylists } from '../../bot/request/youtube.js';
import * as Models from '../models/index.js';
import { TypeOrm } from '../typeorm/typeorm.js';
import { Logger } from '../../common/logger.js';
import { LogLevel } from '../../type/types.js';

export class MusicRepository {
    private repository: Repository<Models.Music>;

    constructor() {
        this.repository = TypeOrm.dataSource.getRepository(Models.Music);
    }

    /**
     * 全ての音楽を取得する
     * @param gid
     */
    public async getAll(gid: string, cid: string): Promise<Models.Music[]> {
        await Logger.put({
            guild_id: gid,
            channel_id: cid,
            user_id: undefined,
            level: LogLevel.INFO,
            event: `repository/music: getAll`
        });
        return await this.repository.find({
            where: { guild_id: gid, channel_id: cid },
            order: { music_id: 'ASC' }
        });
    }

    /**
     * キューの音楽を取得する
     * @param gid
     */
    public async getQueue(gid: string, cid: string): Promise<Models.Music[]> {
        await Logger.put({
            guild_id: gid,
            channel_id: cid,
            user_id: undefined,
            level: LogLevel.INFO,
            event: `repository/music: getQueue`
        });
        return await this.repository.find({
            where: { guild_id: gid, channel_id: cid, is_play: 0 },
            order: { music_id: 'ASC' }
        });
    }

    /**
     * 音楽を保存する
     */
    public async saveAll(gid: string, cid: string, musics: Models.Music[]): Promise<Models.Music[]> {
        await Logger.put({
            guild_id: gid,
            channel_id: cid,
            user_id: undefined,
            level: LogLevel.INFO,
            event: `repository/music: saveAll`
        });

        await this.remove(gid, cid);
        return await this.repository.save(musics);
    }

    public async save(music: DeepPartial<Models.Music>): Promise<boolean> {
        await Logger.put({
            guild_id: music.guild_id,
            channel_id: undefined,
            user_id: undefined,
            level: LogLevel.INFO,
            event: `repository/music: save`
        });
        const result = await this.repository.save(music);
        return Boolean(result);
    }

    public async addRange(
        gid: string,
        cid: string,
        musics: YoutubePlaylists[],
        type: 'youtube' | 'spotify'
    ): Promise<boolean> {
        console.log(`repository/music: addAll`);
        let mid = 0;
        const getMusic = await this.repository.findOne({
            where: { guild_id: gid, channel_id: cid },
            order: { music_id: 'DESC' }
        });
        if (getMusic) {
            mid = getMusic.music_id + 1;
        }
        const list = musics.map((m) => {
            return {
                guild_id: gid,
                channel_id: cid,
                music_id: mid++,
                type: type,
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
    public async add(gid: string, cid: string, music: DeepPartial<Models.Music>, interrupt: boolean): Promise<boolean> {
        await Logger.put({
            guild_id: gid,
            channel_id: cid,
            user_id: undefined,
            level: LogLevel.INFO,
            event: `repository/music: add`
        });
        if (interrupt) {
            const getMusic = await this.repository.findOne({
                where: { guild_id: gid, channel_id: cid },
                order: { music_id: 'ASC' }
            });
            if (!getMusic) {
                const saveMusic = await this.repository.save({ ...music, music_id: 0 });
                return !!saveMusic;
            }
            const saveMusic = await this.repository.save({ ...music, music_id: getMusic.music_id - 1 });
            return !!saveMusic;
        } else {
            const getMusic = await this.repository.findOne({
                where: { guild_id: gid, channel_id: cid },
                order: { music_id: 'DESC' }
            });
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
    public async remove(gid: string, cid: string, musicId?: number): Promise<boolean> {
        await Logger.put({
            guild_id: gid,
            channel_id: cid,
            user_id: undefined,
            level: LogLevel.INFO,
            event: 'repository/music: remove',
            message: [`queue: ${gid}, ${musicId ? musicId : 'all'}`]
        });
        const repository = await this.repository
            .createQueryBuilder()
            .delete()
            .where('guild_id = :gid', { gid })
            .andWhere('channel_id = :cid', { cid });
        if (musicId !== undefined) {
            repository.andWhere('music_id = :musicId', { musicId: musicId });
        }
        const result = await repository.execute();
        return Boolean(result.affected);
    }

    public async resetPlayState(gid: string, cid: string): Promise<boolean> {
        await Logger.put({
            guild_id: gid,
            channel_id: cid,
            user_id: undefined,
            level: LogLevel.INFO,
            event: 'repository/music: resetPlayState'
        });
        const result = await this.repository.update({ guild_id: gid, channel_id: cid }, { is_play: 0 });
        if (result.affected) {
            return true;
        }
        return false;
    }

    public async updatePlayState(gid: string, cid: string, musicId: number, state: boolean): Promise<boolean> {
        const music = await this.repository.findOne({ where: { guild_id: gid, channel_id: cid, music_id: musicId } });

        if (!music) {
            return false;
        }

        await this.save({ ...music, is_play: state ? 1 : 0 });
        await Logger.put({
            guild_id: gid,
            channel_id: cid,
            user_id: undefined,
            level: LogLevel.INFO,
            event: 'repository/music: updatePlayState',
            message: [`update playstate: ${music.title} / ${state}`]
        });
        return true;
    }
}
