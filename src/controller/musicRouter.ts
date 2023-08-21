import Express from 'express';
import { MusicRepository } from '../model/repository/musicRepository.js';
import dayjs from 'dayjs';
import { MusicInfoRepository } from '../model/repository/musicInfoRepository.js';

export const musicRouter = Express.Router();

/**
 * /music GET
 * 現在の音楽リストの表示を行う
 *
 * @param req.query.gid サーバID
 */
musicRouter.get('/music', async (req: Express.Request, res: Express.Response) => {
    console.log('===== /music:get =====');
    console.log(`ip: ${req.ip}`);
    console.log(`timestamp: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
    console.log('======================');
    const gid = req.query.gid as string | undefined;
    const cid = req.query.cid as string | undefined;
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
