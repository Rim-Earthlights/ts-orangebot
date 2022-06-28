import Express from 'express';
import { TextChannel } from 'discord.js';
import { DISCORD_CLIENT } from '../constant/constants';

export const indexRouter = Express.Router();

/**
 * / GET
 * Index表示 特に今は指定していない.
 * Botの管理UIでも作りたい所存.
 */
indexRouter.get('/', (req: Express.Request, res: Express.Response) => {
    res.status(200).send({ result: true });
});
