import express from 'express';
import { isLocalRequest } from '@orangebot/shared';

/**
 * 同じマシン上からのリクエストだけを通すミドルウェア
 * 認証の無いエンドポイントのうち、閲覧以外の操作をするものに付ける (bot からの呼び出しだけを受け付ける)
 */
export function localOnly(req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (!isLocalRequest(req.socket.remoteAddress, req.headers)) {
    res.status(403).send({ result: false, message: 'forbidden.' });
    return;
  }
  next();
}
