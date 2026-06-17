/**
 * 依存ライブラリなしの最小 Cookie ジャー。
 * fetch は Set-Cookie を自動管理しないため、ニコニコのセッション
 * (user_session) と HLS 配信用 (domand_bid) を自前で保持する。
 */

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
}

export class CookieJar {
  private readonly store = new Map<string, Cookie>();

  /** name=value 形式の文字列、または Cookie オブジェクトを取り込む。 */
  set(input: string | Cookie): void {
    const cookie = typeof input === "string" ? CookieJar.parse(input) : input;
    if (!cookie) return;
    this.store.set(cookie.name, cookie);
  }

  /** "a=b; c=d" 形式の Cookie ヘッダ値（セミコロン区切り）をまとめて取り込む。 */
  setFromHeaderString(header: string): void {
    for (const part of header.split(/;\s*/)) {
      const trimmed = part.trim();
      if (trimmed && trimmed.includes("=")) this.set(trimmed);
    }
  }

  /** レスポンスの Set-Cookie 群（getSetCookie() の配列）を取り込む。 */
  setFromResponse(res: Response): void {
    const anyHeaders = res.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const list = anyHeaders.getSetCookie?.() ?? [];
    for (const raw of list) this.set(raw);
  }

  get(name: string): string | undefined {
    return this.store.get(name)?.value;
  }

  has(name: string): boolean {
    return this.store.has(name);
  }

  /** fetch / ffmpeg に渡せる "a=b; c=d" 形式の Cookie ヘッダ値を生成。 */
  toHeader(): string {
    return [...this.store.values()]
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
  }

  /** Set-Cookie ヘッダ1行をパース。属性(Path/Domain)以外は無視。 */
  private static parse(raw: string): Cookie | null {
    const [pair, ...attrs] = raw.split(/;\s*/);
    if (!pair) return null;
    const eq = pair.indexOf("=");
    if (eq < 0) return null;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!name) return null;

    const cookie: Cookie = { name, value };
    for (const attr of attrs) {
      const [k, v] = attr.split("=");
      const key = k?.trim().toLowerCase();
      if (key === "domain") cookie.domain = v?.trim();
      else if (key === "path") cookie.path = v?.trim();
    }
    return cookie;
  }
}
