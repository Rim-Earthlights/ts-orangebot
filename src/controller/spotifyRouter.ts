import dayjs from 'dayjs';
import Express from 'express';
import { CallbackRequest, CallbackResponse } from './types/spotify';

export const spotifyAuthRouter = Express.Router();

/**
 * POST: /spotify/callback
 * Spotify認証のコールバック
 *
 */
spotifyAuthRouter.post('/spotify/callback', async (req: CallbackRequest, res: CallbackResponse) => {
    console.log('==================================================');
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] POST | /spotify/callback`);
    console.log(` * code   : ${req.query.code}`);
    console.log(` * state  : ${req.query.state}`);
    console.log(` * ip     : ${req.ip}`);
    console.log('==================================================');

    if (!req.query.code || !req.query.state) {
        res.status(400).send({ result: 'ERR_BAD_REQUEST' });
        return;
    }
    res.status(200).send({ result: 'OK' });
});
