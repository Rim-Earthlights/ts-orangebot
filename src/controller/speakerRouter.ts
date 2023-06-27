import axios from 'axios';
import Express from 'express';
export const speakerRouter = Express.Router();

/**
 * / GET
 * とりあえずjson返す
 */
speakerRouter.get('/speakers', async (req: Express.Request, res: Express.Response) => {
    const { data } = await axios.get('http://127.0.0.1:50021/speakers');
    res.render('./speaker.ejs', { speakers: data });
});
