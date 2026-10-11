import { IncomingHttpHeaders, Server } from 'node:http';

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// リバースプロキシが付与するヘッダ。これがあれば外部からのリクエストとみなす
const FORWARDED_HEADERS = ['x-forwarded-for', 'x-real-ip', 'forwarded'];

/**
 * 同じマシン上から直接届いたリクエストかどうかを判定する
 * (リバースプロキシ経由のリクエストは接続元が 127.0.0.1 でも外部扱いにする)
 *
 * 同じマシン上のリバースプロキシやトンネルが上記のヘッダを付けずに転送する場合は外部からのリクエストと区別できないため、
 * プロキシ側では必ず X-Forwarded-For などを付けること (本来は認証で守るべきもので、Phase 3 / 4 で対応する)
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
 * HTTP サーバーを閉じる。処理中のリクエストは graceMs だけ待ち、それでも終わらなければ接続を切る
 * @param server 閉じるサーバー
 * @param graceMs 処理中のリクエストを待つ時間
 */
export function closeHttpServer(server: Server, graceMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    server.close((e) => (e ? reject(e) : resolve()));
    server.closeIdleConnections();
    setTimeout(() => server.closeAllConnections(), graceMs).unref();
  });
}
