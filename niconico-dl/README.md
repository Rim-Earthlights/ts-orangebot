# niconico-dl

ニコニコ動画のメタデータ取得と、ffmpeg を用いたストリーム取得を行う TypeScript 製 npm モジュール。`youtube.js` のような感覚で利用できる。

現行（2025 年のサーバ移行後）のニコニコの DMS / domand HLS 配信に対応する。watch API でメタデータと `accessRightKey` を取得し、`access-rights/hls` で払い出される m3u8 と `domand_bid` Cookie を ffmpeg に渡してリマックスする。

## 特徴

- watch API (`v3` / `v3_guest`) からメタデータ・画質一覧を取得
- Cookie / セッション認証（会員限定・年齢制限動画にも `user_session` を渡せば対応）
- `access-rights/hls` 経由で HLS を取得し、ffmpeg で `-c copy`（再エンコードなし）
- Node の `Readable` ストリームとして取得、またはファイルへ直接保存
- 依存ライブラリゼロ（ffmpeg を除く）、strict TypeScript

## 必要環境

- Node.js 18.17 以上（グローバル `fetch` と `Headers.getSetCookie()` を使用）
- ffmpeg（システムにインストール、または `ffmpeg-static` を導入）

```bash
npm install niconico-dl
npm install ffmpeg-static   # 任意。なければ PATH 上の ffmpeg を使用
```

## 使い方

```ts
import { NiconicoClient } from "niconico-dl";
import fs from "node:fs";

// 既存セッションを使う場合（推奨）
const nico = new NiconicoClient({ userSession: process.env.NICO_SESSION });

// または ID/パスワードでログイン（二段階認証アカウントは非対応）
// await nico.login("mail@example.com", "password");

// メタデータ取得
const info = await nico.getInfo("https://www.nicovideo.jp/watch/sm9");
console.log(info.title, info.durationSec, info.formats);

// ストリーム取得
const { stream, done } = await nico.getStream("sm9", { quality: "best" });
stream.pipe(fs.createWriteStream("out.mp4"));
await done;

// あるいはファイルへ直接保存
await nico.download("sm9", "out.mp4", { quality: "best" });
```

## API

### `new NiconicoClient(options?)`

| オプション      | 型                  | 説明                                              |
| --------------- | ------------------- | ------------------------------------------------- |
| `userSession`   | `string`            | `user_session` Cookie。指定でログイン済み扱い     |
| `cookie`        | `string`            | `"a=b; c=d"` 形式の Cookie ヘッダをまとめて投入    |
| `userAgent`     | `string`            | User-Agent の上書き                               |
| `fetch`         | `typeof fetch`      | fetch 実装の差し替え（テスト用）                  |

### メソッド

- `getInfo(urlOrId)` → `Promise<VideoInfo>` — メタデータと画質一覧
- `getStream(urlOrId, options?)` → `Promise<VideoStream>` — `{ stream, done, format, kill }`
- `getStreamFromInfo(info, options?)` — 取得済み `VideoInfo` から（メタデータ再取得を省略）
- `download(urlOrId, destPath, options?)` — ファイルへ保存
- `login(mailTel, password)` — ログイン
- `exportCookies()` → `string` — セッション Cookie を保存用に書き出し
- `isLoggedIn` — ログイン状態

### `StreamOptions`

| オプション    | 型                                              | 既定      | 説明                                  |
| ------------- | ----------------------------------------------- | --------- | ------------------------------------- |
| `quality`     | `"best" \| "worst" \| (formats) => FormatInfo`  | `"best"`  | 取得画質                              |
| `container`   | `"mp4" \| "matroska" \| "mpegts"`               | `"mp4"`   | 出力コンテナ（mp4 はフラグメント mp4）|
| `ffmpegPath`  | `string`                                        | 自動解決  | ffmpeg のパス                         |
| `extraArgs`   | `string[]`                                      | `[]`      | ffmpeg への追加引数                   |
| `signal`      | `AbortSignal`                                   | —         | 中断用                                |

## エラー

- `LoginRequiredError` — 会員限定・年齢制限・PPV・セッション無効
- `VideoUnavailableError` — 削除・非公開・地域制限（`code` / `reasonCode` を保持）
- `FfmpegError` — ffmpeg の起動・実行失敗
- `NiconicoError` — 上記の基底

## 仕組み

1. `GET /api/watch/v3(_guest)/{id}` でメタデータ・`media.domand`・`accessRightKey`・`watchTrackId` を取得
2. `POST nvapi.nicovideo.jp/v1/watch/{id}/access-rights/hls`（`X-Access-Right-Key` 付き、ボディ `{outputs:[[videoId,audioId]]}`）で m3u8 の `contentUrl` を取得
3. 同レスポンスで払い出される `domand_bid` Cookie を含めて ffmpeg を起動し、HLS を mp4 へリマックス

## 注意

ニコニコの API 仕様は予告なく変更されることがある。取得したコンテンツの利用は、ニコニコの利用規約および著作権法を遵守すること。本モジュールは私的利用・技術検証を目的とする。

## ライセンス

MIT
