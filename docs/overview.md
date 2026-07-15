# OrangeBot-TS プロジェクト概要

## はじめに

OrangeBot-TS は、Orange Server 向けの多機能 Discord Bot です。TypeScript で開発されており、ボイスチャンネル管理、ガチャシステム、音楽再生、天気予報、AI チャットなど多彩な機能を提供します。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| 言語 | TypeScript 5.8 |
| Bot フレームワーク | discord.js v14 |
| Web サーバー | Express v5 |
| ORM | TypeORM v0.3 |
| データベース | MariaDB |
| AI | OpenAI API (LiteLLM プロキシ経由) |
| 音楽再生 | @discordjs/voice / youtubei.js (Innertube) |
| 読み上げ (TTS) | VOICEVOX / COEIROINK (`packages/speak`) |
| スケジューラ | node-cron |

## 主要機能

- **ボイスチャンネル管理** - ロビーに参加すると自動でルームを作成、退出時に自動削除
- **ガチャシステム** - 毎日補充される抽選回数 (30 未満なら +10) でアイテムを引く
- **音楽再生** - YouTube の検索・再生 (youtubei.js)、プレイリスト管理、ループ・シャッフル
- **AI チャット** - LiteLLM プロキシ経由で複数の LLM モデル (GPT-4, Claude 等) を利用。Tool Calling により天気・ユーザーアクティビティ等のコンテキストを自動取得
- **天気予報** - OpenWeatherMap API による地域別天気予報
- **ゲーム** - ダイス、チンチロリン、チーム分け、ITO 等
- **読み上げ (TTS)** - 専用の読み上げ Bot (`packages/speak`) を HTTP で呼び出してテキストを読み上げ。VOICEVOX / COEIROINK 対応
- **管理機能** - ミュート、タイムアウト、ユーザー権限管理

## エントリーポイント

`packages/bot/src/app.ts` がメインのエントリーポイントです。起動時に以下を行います:

1. Express サーバーのセットアップ (Helmet, CORS, EJS テンプレート)
2. TypeORM による MariaDB 接続 (`synchronize: false`、スキーマはマイグレーションで管理)
3. ガチャアイテムのメモリロード
4. Discord Bot ログイン・イベントハンドラ登録
5. スラッシュコマンドの登録
6. Cron ジョブの初期化

読み上げ Bot のエントリーポイントは `packages/speak/src/app.ts` です。インスタンス別の JSON 設定 (`src/config/<name>.json`) を引数に取り、Express サーバー起動 → MariaDB 接続 (bot と同一 DB、`synchronize: false`) → Discord ログイン → 読み上げ用スラッシュコマンド登録を行います。インスタンスごとに別の Discord トークン / ポートで複数起動できます (例: lemon=4100, lime=4101)。

## モノレポ構成

pnpm workspace を採用しており、以下のパッケージで構成されています:

- `packages/bot` — Discord Bot 本体 (Express + Discord.js)
- `packages/shared` — 共有層 (TypeORM エンティティ / リポジトリ / DataSource ファクトリ / 共通型)
- `packages/speak` — 読み上げ Bot (VOICEVOX / COEIROINK)。bot から HTTP (`/speaker/call` 等) で呼び出され、複数インスタンス起動可能

## pnpm スクリプト

ルートから実行するスクリプト:

```bash
pnpm build              # 全パッケージをビルド (pnpm -r build, shared → bot/speak の順)
pnpm clean              # 全パッケージの dist を削除
pnpm dev                # Bot を nodemon で開発モード起動 (事前に shared のビルドが必要)
pnpm dev:speak          # 読み上げ Bot を開発モード起動 (src/config/dev.json を使用。事前に shared のビルドが必要)
pnpm lint               # Bot に対して ESLint
pnpm smoke-test         # Bot の起動疎通確認 (事前に shared のビルドが必要)
pnpm test               # 全パッケージのユニットテスト (vitest)
pnpm test:integration   # インテグレーションテスト (要テスト用 DB)
pnpm test:db:up         # テスト用 MariaDB を docker compose で起動
pnpm test:db:down       # テスト用 MariaDB を停止・破棄
```

Bot パッケージ単体での操作:

```bash
pnpm --filter @orangebot/bot start         # ビルド成果物を実行
pnpm --filter @orangebot/bot smoke-test    # 起動 〜 シャットダウンの疎通確認
```

読み上げ Bot (speak) 単体での操作:

```bash
pnpm --filter @orangebot/speak build                          # ビルド
pnpm --filter @orangebot/speak start src/config/<name>.json   # インスタンス別設定で起動
```

shared パッケージのマイグレーション CLI (Phase 2-1 以降に本格運用):

```bash
pnpm --filter @orangebot/shared migration:show      # 適用済み/未適用の一覧
pnpm --filter @orangebot/shared migration:generate src/migrations/<Name>
pnpm --filter @orangebot/shared migration:run
pnpm --filter @orangebot/shared migration:revert
```
