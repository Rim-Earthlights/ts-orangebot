import Express from 'express';
import { TextChannel } from 'discord.js';
import { DISCORD_CLIENT } from '../constant/constants';
import { MusicRepository } from '../model/repository/musicRepository';

export const musicRouter = Express.Router();

/**
 * /music GET
 * 現在の音楽リストの表示を行う
 *
 * @param req.query.gid サーバID
 */
musicRouter.get('/music', async (req: Express.Request, res: Express.Response) => {
    const gid = req.query.gid as string | undefined;
    if (!gid) {
        res.status(400).send({ code: 400, message: 'gid is required' });
        return;
    }

    const musicRepository = new MusicRepository();
    const musics = await musicRepository.getAll(gid);

    console.log(musics);

    res.render('./music.ejs', { musics: musics });
});
