# アーキテクチャ

## モノレポ構成

pnpm workspace により以下のパッケージで構成されています。

```
packages/
├── bot/        # Discord Bot 本体 (Express + Discord.js)
└── shared/     # 共有層: TypeORM エンティティ / リポジトリ / DataSource ファクトリ / 共通型 (LoggerPort, DTO)
```

### shared パッケージの構成

```
packages/shared/src/
├── config/         # createDataSource ファクトリ + getDataSource アクセサ
├── models/         # 17 個の TypeORM エンティティ
├── repository/     # 13 個のリポジトリ (Logger は LoggerPort 経由で注入)
├── migrations/     # TypeORM マイグレーション (Phase 2-1 以降で synchronize: false に切替)
└── types/          # LogData / LogLevel / LoggerPort / MusicAddItem DTO
```

bot は `@orangebot/shared` 経由でこれらにアクセスし、起動時に `createDataSource(...)` で DataSource を初期化する。`packages/bot/src/common/logger.ts` がモジュール読み込み時に `setLogger()` で自身を shared に登録するため、shared 内のリポジトリから `getLogger().put(...)` で bot 側 Logger を呼び出せる。

## ディレクトリ構成 (`packages/bot/src`)

```
packages/bot/src/
├── app.ts                    # エントリーポイント (Express + Discord Bot)
├── auth.ts                   # 認証モジュール
├── routers.ts                # Express ルーター集約
│
├── bot/                      # Bot コアロジック
│   ├── dot_function/         # ドットコマンド (`.xxx`) のビジネスロジック
│   │   ├── chat.ts                # AI チャット (本体)
│   │   ├── chat_attachments.ts    # 添付ファイル処理
│   │   ├── chat_tools/            # Tool Calling 用ツール群
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── userActivity.ts    # ユーザーアクティビティ取得
│   │   │   └── weather.ts         # 天気取得
│   │   ├── dice.ts                # ダイス / ゲーム
│   │   ├── forecast.ts            # 天気予報
│   │   ├── gacha.ts               # ガチャ
│   │   ├── music.ts               # 音楽再生
│   │   ├── room.ts                # ルーム管理
│   │   ├── register.ts            # ユーザー登録
│   │   ├── speak.ts               # 読み上げ (TTS)
│   │   ├── voice.ts               # ボイスチャンネルイベント
│   │   ├── mention.ts             # メンション処理
│   │   ├── debug.ts               # デバッグ
│   │   └── index.ts
│   │
│   ├── manager/              # コマンドルーティング
│   │   ├── message.manager.ts      # ドットコマンドのルーター
│   │   ├── interaction.manager.ts  # スラッシュコマンドのルーター
│   │   ├── message.handler.ts      # メッセージハンドラ I/F
│   │   ├── interaction.handler.ts  # インタラクションハンドラ I/F
│   │   └── handlers/
│   │       ├── commands/           # ドットコマンドハンドラ (19 ファイル)
│   │       └── interactions/       # スラッシュコマンドハンドラ (24 ファイル)
│   │
│   ├── request/              # 外部 API クライアント
│   │   ├── openai.ts         # OpenAI / LiteLLM
│   │   ├── youtube.ts        # YouTube API
│   │   └── spotify.ts        # Spotify
│   │
│   ├── services/             # サービス層 (chat.service.ts は現状空)
│   ├── function/             # ユーティリティ関数
│   ├── reactions.ts          # リアクション処理
│   └── mention.ts            # メンションロジック
│
├── controller/               # Express ルートハンドラ (8 ルーター)
├── config/                   # 設定ファイル
├── constant/                 # 定数・定義
├── job/                      # Cron ジョブ
├── common/                   # 共通ユーティリティ (logger.ts は shared に setLogger 登録)
├── service/                  # 追加サービス
├── interface/                # TypeScript インターフェース
└── type/                     # 型定義 (openai.ts のみ。LogLevel/LogData は @orangebot/shared に移動済み)
```

> モデル / リポジトリ / DataSource 設定は `@orangebot/shared` (`packages/shared/src/`) に移動済み。bot 側は import のみ。

## メッセージフロー

### ドットコマンド (`.xxx`)

```
ユーザーがメッセージ送信
  → app.ts (messageCreate イベント)
    → MessageManager.execute()
      → コマンド名で Map からハンドラを検索
        → Handler.execute(message, command, args)
          → dot_function 内のビジネスロジックを呼び出し
```

### スラッシュコマンド (`/xxx`)

```
ユーザーがスラッシュコマンド実行
  → app.ts (interactionCreate イベント)
    → InteractionManager.execute()
      → コマンド名で Map からハンドラを検索
        → Handler.execute(interaction)
```

### ボイスチャンネル

```
ユーザーがボイスチャンネルに参加/退出
  → app.ts (voiceStateUpdate イベント)
    → Voice.channelUpdate()
      → ロビーに参加 → 自動ルーム作成
      → ルームが空に → 自動削除 (is_autodelete が有効の場合)
```

## 設計パターン

### Handler パターン
- すべてのコマンドハンドラは `MessageHandler` または `InteractionHandler` インターフェースを実装
- `execute()` メソッドでコマンドを処理

### Repository パターン
- データアクセスはリポジトリ経由で抽象化
- 各エンティティに対応するリポジトリが存在
- ソフトデリート対応 (`deleted_at` カラム)

### Manager パターン
- `MessageManager` / `InteractionManager` が Map ベースでハンドラを管理
- 1 つのハンドラに複数のコマンド名 (エイリアス) をマッピング可能

## 外部 API 連携

| サービス | 用途 | 設定キー |
|---|---|---|
| OpenAI / LiteLLM | AI チャット (複数モデル対応) | `OPENAI.KEY`, `OPENAI.BASE_URL` |
| YouTube Data API | プレイリスト取得・検索 | `YOUTUBE.KEY` |
| OpenWeatherMap | 天気予報 | `FORECAST.KEY` |
| Spotify | 歌詞連携・OAuth | Spotify OAuth 設定 |
| VOICEVOX | テキスト読み上げ | TTS Bot 経由 |

## Cron ジョブ

| スケジュール | 処理内容 |
|---|---|
| `0 0 * * *` (毎日0時) | ユーザーのガチャチケットをリセット |
| `* * * * *` (毎分) | 1時間以上アイドル状態のチャットセッションをクリーンアップ |
