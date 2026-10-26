import { IncomingHttpHeaders, Server } from 'node:http';
import { BlockList, isIPv4, isIPv6 } from 'node:net';

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

// ループバック・プライベートアドレス・リンクローカルアドレス
const LAN_ADDRESSES = new BlockList();
LAN_ADDRESSES.addSubnet('127.0.0.0', 8, 'ipv4');
LAN_ADDRESSES.addSubnet('10.0.0.0', 8, 'ipv4');
LAN_ADDRESSES.addSubnet('172.16.0.0', 12, 'ipv4');
LAN_ADDRESSES.addSubnet('192.168.0.0', 16, 'ipv4');
LAN_ADDRESSES.addSubnet('169.254.0.0', 16, 'ipv4');
LAN_ADDRESSES.addAddress('::1', 'ipv6');
LAN_ADDRESSES.addSubnet('fc00::', 7, 'ipv6');
LAN_ADDRESSES.addSubnet('fe80::', 10, 'ipv6');

/**
 * LAN 内 (同じマシンを含む) から直接届いたリクエストかどうかを判定する
 * (リバースプロキシ経由のリクエストは接続元が LAN 内のアドレスでも外部扱いにする)
 * @param remoteAddress 接続元アドレス
 * @param headers リクエストヘッダ
 */
export function isLanRequest(remoteAddress: string | undefined, headers: IncomingHttpHeaders): boolean {
  if (!remoteAddress) {
    return false;
  }
  const family = isIPv4(remoteAddress) ? 'ipv4' : isIPv6(remoteAddress) ? 'ipv6' : undefined;
  if (!family || !LAN_ADDRESSES.check(remoteAddress, family)) {
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
