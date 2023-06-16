import Express from 'express';
import dayjs from 'dayjs';
import { GachaRepository } from '../model/repository/gachaRepository.js';

export const gachaRouter = Express.Router();

/**
 * /gacha get
 * gachaの履歴を取得する
 *
 * @param req.body.uid 指定ユーザID
 * @param req.body.date 指定日
 * @param req.body.limit 件数指定
 */
gachaRouter.get('/gacha', async (req: Express.Request, res: Express.Response) => {
    const uid = req.query.uid as string;
    const date = req.query.date ? dayjs(req.query.date as string).toDate() : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    console.log('==================================================');
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] GET | /gacha`);

    console.log(req.query);
    console.log(` * ip     : ${req.ip}`);
    console.log(` * uid    : ${uid}`);
    console.log(` * date   : ${date}`);
    console.log(` * limit  : ${limit}`);
    console.log('==================================================');

    const repository = new GachaRepository();

    if (!uid) {
        res.status(400).send({ result: 'ERR_BAD_REQUEST' });
        return;
    }

    const gacha = await repository.getHistory(uid, date, limit);
    res.status(200).send(gacha);
});
