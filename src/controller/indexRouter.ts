import Express from 'express';
import { TextChannel } from 'discord.js';
import { DISCORD_CLIENT } from '../constant/constants';

export const indexRouter = Express.Router();

/**
 * / get
 * Index
 *
 */
indexRouter.get('/', (req: Express.Request, res: Express.Response) => {
    res.status(200).send({ result: true });
});
