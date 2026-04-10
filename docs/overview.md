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
| 音楽再生 | discord-player-plus / @discordjs/voice / @distube/ytdl-core |
| スケジューラ | node-cron |

## 主要機能

- **ボイスチャンネル管理** - ロビーに参加すると自動でルームを作成、退出時に自動削除
- **ガチャシステム** - 毎日リセットされるチケットでアイテムを引く
- **音楽再生** - YouTube の検索・再生、プレイリスト管理、ループ・シャッフル
- **AI チャット** - LiteLLM プロキシ経由で複数の LLM モデル (GPT-4, Claude 等) を利用
- **天気予報** - OpenWeatherMap API による地域別天気予報
- **ゲーム** - ダイス、チンチロリン、チーム分け、ITO 等
- **読み上げ (TTS)** - VOICEVOX 連携によるテキスト読み上げ
- **管理機能** - ミュート、タイムアウト、ユーザー権限管理

## エントリーポイント

`src/app.ts` がメインのエントリーポイントです。起動時に以下を行います:

1. Express サーバーのセットアップ (Helmet, CORS, EJS テンプレート)
2. TypeORM による MariaDB 接続・スキーマ同期
3. ガチャアイテムのメモリロード
4. Discord Bot ログイン・イベントハンドラ登録
5. スラッシュコマンドの登録
6. Cron ジョブの初期化

## npm スクリプト

```bash
npm run build     # TypeScript コンパイル
npm run start     # ビルド後に実行
npm run dev       # nodemon による開発モード
npm run lint      # ESLint
npm run format    # Prettier
```
