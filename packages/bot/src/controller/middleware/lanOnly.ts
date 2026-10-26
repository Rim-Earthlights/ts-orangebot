import Express from 'express';
import { isLanRequest } from '@orangebot/shared';

/**
 * LAN 内 (同じマシンを含む) からのリクエストだけを通すミドルウェア
 * LAN 内の端末のブラウザから使う画面の操作に付ける (Phase 3 の API で認証を入れるまでの暫定措置)
 */
export function lanOnly(req: Express.Request, res: Express.Response, next: Express.NextFunction): void {
  if (!isLanRequest(req.socket.remoteAddress, req.headers)) {
    res.status(403).send({ result: false, message: 'forbidden.' });
    return;
  }
  next();
}
