import axios from 'axios';
import Express from 'express';
import { getAsync } from '../common/webWrapper';
import { URLSearchParams } from 'url';

export const speakerRouter = Express.Router();

/**
 * / GET
 * とりあえずjson返す
 */
speakerRouter.get('/speakers', async (req: Express.Request, res: Express.Response) => {
    const { data } = await getAsync('http://127.0.0.1:50021/speakers', new URLSearchParams());
    res.render('./speaker.ejs', { speakers: data });
});
