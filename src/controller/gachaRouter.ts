import Express from 'express';
import dayjs from 'dayjs';
import { GachaRepository } from '../model/repository/gachaRepository.js';
import { Logger } from '../common/logger.js';
import { LogLevel } from '../type/types.js';

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

  Logger.put({
    guild_id: undefined,
    channel_id: undefined,
    user_id: uid,
    level: LogLevel.INFO,
    event: 'GET /gacha',
    message: [`ip: ${req.ip}`, `date: ${date}`, `limit: ${limit}`],
  });

  const repository = new GachaRepository();

  if (!uid) {
    res.status(400).send({ result: 'ERR_BAD_REQUEST' });
    return;
  }

  const gacha = await repository.getHistory(uid, date, limit);
  res.render('./gacha.ejs', { gacha });
});

gachaRouter.get('/gacha/history', async (req: Express.Request, res: Express.Response) => {
  const uid = req.query.uid as string;
  const hist = (req.query.hist as string).toLowerCase() === 'true';

  Logger.put({
    guild_id: undefined,
    channel_id: undefined,
    user_id: uid,
    level: LogLevel.INFO,
    event: 'GET /gacha',
    message: [`ip: ${req.ip}`],
  });

  const repository = new GachaRepository();

  const gachaList = await repository.getPresents(uid, hist);

  res.render('./present.ejs', { gachaList });
});
