import Express from 'express';
import { isLocalRequest } from '@orangebot/shared';

/**
 * 同じマシン上からのリクエストだけを通すミドルウェア
 * 認証の無いエンドポイントのうち、閲覧以外の操作をするものに付ける (Phase 3 の API で認証を入れるまでの暫定措置)
 */
export function localOnly(req: Express.Request, res: Express.Response, next: Express.NextFunction): void {
  if (!isLocalRequest(req.socket.remoteAddress, req.headers)) {
    res.status(403).send({ result: false, message: 'forbidden.' });
    return;
  }
  next();
}
