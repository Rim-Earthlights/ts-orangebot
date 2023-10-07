import Express from 'express';
import { MusicRepository } from '../model/repository/musicRepository.js';
import dayjs from 'dayjs';
import { MusicInfoRepository } from '../model/repository/musicInfoRepository.js';
import { Logger } from '../common/logger.js';
import { LogLevel } from '../type/types.js';

export const musicRouter = Express.Router();

/**
 * /music GET
 * 現在の音楽リストの表示を行う
 *
 * @param req.query.gid サーバID
 */
musicRouter.get('/music', async (req: Express.Request, res: Express.Response) => {
    const gid = req.query.gid as string | undefined;
    const cid = req.query.cid as string | undefined;

    Logger.put({
        guild_id: gid,
        channel_id: cid,
        user_id: undefined,
        level: LogLevel.INFO,
        event: 'GET /music',
        message: [`ip: ${req.ip}`]
    });

    if (!gid || !cid) {
        res.status(400).send({ code: 400, message: 'gid/cid is required' });
        return;
    }

    const musicRepository = new MusicRepository();
    const musics = await musicRepository.getAll(gid, cid);
    const infoRepository = new MusicInfoRepository();
    const info = await infoRepository.get(gid, cid);
    if (musics.length <= 0) {
        res.status(404).send({ code: 404, message: 'not found musics.' });
    }

    res.render('./music.ejs', { musics: musics, current: info });
});
