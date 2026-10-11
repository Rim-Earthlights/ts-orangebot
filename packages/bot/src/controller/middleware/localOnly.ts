import Express from 'express';
import { IncomingHttpHeaders } from 'node:http';

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// リバースプロキシが付与するヘッダ。これがあれば外部からのリクエストとみなす
const FORWARDED_HEADERS = ['x-forwarded-for', 'x-real-ip', 'forwarded'];

/**
 * 同じマシン上から直接届いたリクエストかどうかを判定する
 * (リバースプロキシ経由のリクエストは接続元が 127.0.0.1 でも外部扱いにする)
 * @param remoteAddress 接続元アドレス
 * @param headers リクエストヘッダ
 */
export function isLocalRequest(remoteAddress: string | undefined, headers: IncomingHttpHeaders): boolean {
  if (!remoteAddress || !LOOPBACK_ADDRESSES.has(remoteAddress)) {
    return false;
  }
  return FORWARDED_HEADERS.every((name) => headers[name] === undefined);
}

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
