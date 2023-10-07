import Express from 'express';
import { CallbackRequest, CallbackResponse } from './types/spotify';
import { Logger } from '../common/logger';
import { LogLevel } from '../type/types';

export const spotifyAuthRouter = Express.Router();

/**
 * POST: /spotify/callback
 * Spotify認証のコールバック
 *
 */
spotifyAuthRouter.post('/spotify/callback', async (req: CallbackRequest, res: CallbackResponse) => {
    if (!req.query.code || !req.query.state) {
        res.status(400).send({ result: 'ERR_BAD_REQUEST' });
        return;
    }

    Logger.put({
        guild_id: undefined,
        channel_id: undefined,
        user_id: undefined,
        level: LogLevel.SYSTEM,
        event: 'POST /spotify/callback',
        message: [`ip: ${req.ip}`, `code: ${req.query.code}`, `state: ${req.query.state}`]
    });

    res.status(200).send({ result: 'OK' });
});
