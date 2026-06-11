# アーキテクチャ

## モノレポ構成

pnpm workspace により以下のパッケージで構成されています。

```
packages/
├── bot/        # Discord Bot 本体 (Express + Discord.js)
├── shared/     # 共有層: TypeORM エンティティ / リポジトリ / DataSource ファクトリ / 共通型 (LoggerPort, DTO)
└── speak/      # 読み上げ Bot (VOICEVOX / COEIROINK)。bot から HTTP で呼び出される
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

bot / speak は `@orangebot/shared` 経由でこれらにアクセスし、起動時に `createDataSource(...)` で DataSource を初期化する。`packages/bot/src/common/logger.ts` がモジュール読み込み時に `setLogger()` で自身を shared に登録するため、shared 内のリポジトリから `getLogger().put(...)` で bot 側 Logger を呼び出せる。

### speak パッケージの構成

旧 speak-voicevox を `packages/speak` として統合した読み上げ Bot。DB 層は `@orangebot/shared` を利用する (bot と同一 DB を共有するため `synchronize: false` で接続)。インスタンスごとに別の Discord トークン / ポートを JSON 設定で渡して複数起動する (例: lemon=4100, lime=4101)。

```
packages/speak/src/
├── app.ts                    # エントリーポイント (引数の JSON 設定を読み込み、Express + Discord Bot 起動)
├── routers.ts                # Express ルーター集約
├── bot/
│   ├── commands.ts           # ドットコマンド / スラッシュコマンドのセレクタ
│   ├── dot_function/         # chat / room / speak のビジネスロジック
│   ├── function/             # スラッシュコマンド向けロジック
│   └── service/              # chatService (LLM セッション) / speakService (音声合成・再生)
├── controllers/              # speak.controller (bot から呼ばれる HTTP API)
├── config/                   # config.template.ts (DB/OpenAI 共通) + example.json.template (インスタンス別)
├── common/                   # logger / VOICEVOX・COEIROINK のスピーカー ID 解決
├── constant/                 # 定数 (DISCORD_CLIENT 等)
├── interface/                # 音声合成 API のレスポンス型
└── job/                      # Cron ジョブ (アイドル LLM セッションの破棄)
```

bot → speak の HTTP API (`controllers/speak.controller.ts`):

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/speaker/status/:guildId` | 読み上げ Bot の使用状況を取得 |
| POST | `/speaker/call` | ボイスチャンネルに読み上げ Bot を呼び出す |
| POST | `/speaker/discon` | 読み上げ Bot を切断する |

使用状況は shared の `SpeakerRepository` (speaker テーブル) で guild × bot ユーザー単位に管理される。音声合成は VOICEVOX (port 50021) / COEIROINK (port 50032) のローカルエンジンを HTTP で呼び出す。

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
│   │       └── interactions/       # スラッシュコマンドハンドラ (25 ファイル)
│   │
│   ├── request/              # 外部 API クライアント
│   │   ├── openai.ts         # OpenAI / LiteLLM
│   │   ├── innertube.ts      # youtubei.js (Innertube) — 音楽再生用ストリーム取得
│   │   ├── youtube.ts        # YouTube Data API
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

### 読み上げ (TTS)

```
ユーザーが .speak / /speak を実行 (bot 側)
  → Speak.call()
    → SpeakerRepository で未使用の読み上げ Bot を検索
      → 該当インスタンスへ HTTP POST /speaker/call (lemon=4100, lime=4101)
        → speak 側がボイスチャンネルに接続し is_used を更新
          → 以降のテキストを VOICEVOX / COEIROINK で音声合成して再生
            → .discon / /discon で切断・解放
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
| YouTube (Innertube / youtubei.js) | 音楽再生のストリーム取得・検索 | `YOUTUBE.COOKIE` (ログイン Cookie, 任意) |
| YouTube Data API | プレイリスト取得・検索 | `YOUTUBE.KEY` |
| OpenWeatherMap | 天気予報 | `FORECAST.KEY` |
| Spotify | 歌詞連携・OAuth | Spotify OAuth 設定 |
| VOICEVOX / COEIROINK | テキスト読み上げ (音声合成) | speak パッケージがローカルエンジン (50021 / 50032) を直接呼び出し |

## ボイスチャンネルの E2EE (DAVE)

Discord のボイスチャンネル E2EE (DAVE プロトコル) には `@discordjs/voice` v0.19 + `@snazzah/davey` で対応している (bot の音楽再生・speak の読み上げ共通)。音楽再生はかつての play-dl / ytdl-core / discord-player-plus から youtubei.js (Innertube) に移行済み。

## Cron ジョブ

| パッケージ | スケジュール | 処理内容 |
|---|---|---|
| bot | `0 0 * * *` (毎日0時) | ユーザーのガチャチケットをリセット |
| bot | `* * * * *` (毎分) | 1時間以上アイドル状態のチャットセッションをクリーンアップ |
| speak | `* * * * *` (毎分) | 30分以上アイドル状態の LLM セッションを破棄 |
