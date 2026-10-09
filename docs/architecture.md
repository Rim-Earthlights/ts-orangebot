# アーキテクチャ

## モノレポ構成

pnpm workspace により以下のパッケージで構成されています。

```
packages/
├── bot/        # Discord Bot 本体 (Express + Discord.js)
├── shared/     # 共有層: TypeORM エンティティ / リポジトリ / サービス層 / DataSource ファクトリ / 共通型 (LoggerPort, DTO)
└── speak/      # 読み上げ Bot (VOICEVOX / COEIROINK)。bot から HTTP で呼び出される
```

### shared パッケージの構成

```
packages/shared/src/
├── config/         # createDataSource ファクトリ + getDataSource アクセサ
├── models/         # 17 個の TypeORM エンティティ
├── repository/     # 13 個のリポジトリ (Logger は LoggerPort 経由で注入)
├── migrations/     # TypeORM マイグレーション (Phase 2-1 以降で synchronize: false に切替)
├── services/       # Discord 非依存のサービス層 (Chat / Dice / Gacha / Music / Photo / Room / User の 7 個)
├── utils/          # chatHistory.ts / typing.ts (startTyping: LLM 応答待ち中に 8 秒ごと sendTyping を再送)
├── constants/      # dice.ts / gacha.ts
├── common/         # random.ts
└── types/          # chat / gacha / log (LogData / LogLevel / LoggerPort) / music (MusicAddItem DTO) / user
```

これらはすべて `packages/shared/src/index.ts` から再エクスポートされる。

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
├── config/                   # config.template.ts (DB/LiteLLM 共通) + api.ts (音声合成エンジンの接続先解決) + example.json.template (インスタンス別 JSON の雛形。例: lemon.json / lime.json、gitignore 対象)
├── common/                   # logger / webWrapper / VOICEVOX・COEIROINK のスピーカー ID 解決
├── constant/                 # 定数 (DISCORD_CLIENT、キャラクターのシステムプロンプト CHATBOT_LEMON_TEMPLATE / CHATBOT_LIME_TEMPLATE) / voiceType.ts
├── interface/                # 音声合成 API のレスポンス型
├── type/                     # 型定義
└── job/                      # Cron ジョブ (アイドル LLM セッションの破棄)
```

speak の LLM チャット (`bot/dot_function/chat.ts`) も shared の `startTyping()` で応答待ちの間「入力中...」を表示する。

bot → speak の HTTP API (`controllers/speak.controller.ts`):

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/speaker/status/:guildId` | 読み上げ Bot の使用状況を取得 |
| POST | `/speaker/call` | ボイスチャンネルに読み上げ Bot を呼び出す |
| POST | `/speaker/discon` | 読み上げ Bot を切断する |

使用状況は shared の `SpeakerRepository` (speaker テーブル) で guild × bot ユーザー単位に管理される。音声合成エンジンの接続先は bot / speak それぞれの `config/api.ts` で解決する。`config.ts` の `API.VOICEVOX` / `API.COEIROINK` を参照し、`API` が未設定 (既存の config.ts など) の場合は `127.0.0.1:50021` / `127.0.0.1:50022` にフォールバックする (末尾の `/` は除去)。

エンジン本体は podman コンテナとして systemd user unit (Quadlet) で動かす。ユニット定義・COEIROINK のイメージビルド手順は `containers/` (`containers/README.md`) を参照。

## ディレクトリ構成 (`packages/bot/src`)

```
packages/bot/src/
├── app.ts                    # エントリーポイント (Express + Discord Bot)
├── auth.ts                   # 認証モジュール
├── routers.ts                # Express ルーター集約
│
├── bot/                      # Bot コアロジック
│   ├── adapters/             # Discord ↔ shared サービスの橋渡し (Phase 2-3)
│   │   ├── chat.adapter.ts        # AI チャット (ChatService + Embed 整形)
│   │   ├── music.adapter.ts       # 音楽再生 (MusicService + 音声接続/再生)
│   │   └── room.adapter.ts        # ルーム管理 (RoomService + チャンネル操作)
│   │
│   ├── dot_function/         # ドットコマンド (`.xxx`) のビジネスロジック
│   │   ├── chat.ts                # AI チャット (adapters/chat.adapter.ts への再エクスポート)。LLM クライアントは chat.adapter.ts 内で openai SDK を使って生成
│   │   ├── chat_attachments.ts    # 添付ファイル処理
│   │   ├── chat_tools/            # Tool Calling 用ツール群
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── commands.ts        # Bot コマンド一覧取得
│   │   │   ├── userActivity.ts    # ユーザーアクティビティ取得
│   │   │   ├── weather.ts         # 天気取得 (地域名)
│   │   │   └── weatherByCoordinates.ts # 天気取得 (緯度経度)
│   │   ├── dice.ts                # ダイス / ゲーム
│   │   ├── forecast.ts            # 天気予報
│   │   ├── gacha.ts               # ガチャ (抽選は shared の GachaService)
│   │   ├── music.ts               # 音楽再生 (adapters/music.adapter.ts への再エクスポート)
│   │   ├── room.ts                # ルーム管理 (adapters/room.adapter.ts への再エクスポート)
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
│   │   ├── base.handler.ts         # ハンドラ共通の基底クラス
│   │   └── handlers/
│   │       ├── commands/           # ドットコマンドハンドラ (19 ファイル)
│   │       └── interactions/       # スラッシュコマンドハンドラ (29 ファイル。rust.handler.ts 等)
│   │
│   ├── request/              # 外部 API クライアント
│   │   ├── innertube.ts      # youtubei.js (Innertube) — 音楽再生用ストリーム取得
│   │   ├── youtube.ts        # YouTube Data API
│   │   ├── openai.ts         # (空ファイル。未使用)
│   │   └── spotify.ts        # (空ファイル。未使用)
│   │
│   ├── function/             # スラッシュコマンド向けロジック (chat / dice / dict / gacha / room / speak / vchat※仮実装)
│   ├── utils/                # 補助ユーティリティ (roomName.ts, gameSelect.ts: ルーム作成時の「ゲームの選択」メッセージ, memberAccept.ts: ルール同意リアクションと /accept 共通のロール付与・ユーザー登録)
│   ├── reactions.ts          # リアクション処理
│   └── mention.ts            # メンションロジック
│
├── controller/               # Express ルートハンドラ (8 ルーター。spotifyRouter は routers.ts に未登録)
├── config/                   # config.template.ts (→ config.ts) / api.ts (音声合成エンジンの接続先解決)
├── constant/                 # 定数・定義 (slashCommands.ts、ヘルプ文言、システムプロンプト CHATBOT_TEMPLATE 等)
├── job/                      # Cron ジョブ
├── common/                   # 共通ユーティリティ (logger.ts は shared に setLogger 登録)
├── service/                  # 追加サービス
├── interface/                # TypeScript インターフェース
└── type/                     # 型定義 (openai.ts のみ。LogLevel/LogData は @orangebot/shared に移動済み)
```

> モデル / リポジトリ / DataSource 設定は `@orangebot/shared` (`packages/shared/src/`) に移動済み。bot 側は import のみ。
> Discord 非依存のサービス層 (`DiceService` / `PhotoService` / `GachaService` / `UserService` / `ChatService` / `RoomService` / `MusicService`) も `@orangebot/shared` の `services/` に集約済み (Phase 2)。bot は `bot/adapters/` 経由でこれらを呼び出し、Embed 整形・音声接続などの Discord 固有処理のみを担当する。

## メッセージフロー

### ドットコマンド (`.xxx`)

```
ユーザーがメッセージ送信
  → app.ts (messageCreate イベント)
    → MessageManager.handle()
      → コマンド名で Map からハンドラを検索
        → Handler.execute(message, command, args)
          → dot_function 内のビジネスロジックを呼び出し
```

### スラッシュコマンド (`/xxx`)

```
ユーザーがスラッシュコマンド実行
  → app.ts (interactionCreate イベント)
    → InteractionManager.handle()
      → コマンド名で Map からハンドラを検索
        → Handler.execute(interaction)
```

### ボイスチャンネル

```
ユーザーがボイスチャンネルに参加/退出
  → app.ts (voiceStateUpdate イベント)
    → joinVoiceChannel() / leftVoiceChannel() (dot_function/voice.ts)
      → ロビーに参加 → 自動ルーム作成 → 「ゲームの選択」メッセージを投稿 (utils/gameSelect.ts)
      → 🎮 リアクション → VC ステータスにプレイ中のゲーム名を設定 (reactions.ts)
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
| LiteLLM (openai SDK) | AI チャット (複数モデル対応) | `LITELLM.KEY`, `LITELLM.BASE_URL`, `LITELLM.DEFAULT_MODEL` / `LOW_MODEL` / `HIGH_MODEL` (旧 `OPENAI.*`) |
| YouTube (Innertube / youtubei.js) | 音楽再生のストリーム取得・検索 | `YOUTUBE.COOKIE` (ログイン Cookie, 任意) |
| YouTube Data API | プレイリスト取得・検索 | `YOUTUBE.KEY` |
| OpenWeatherMap | 天気予報 | `FORECAST.KEY` |
| Spotify | 歌詞連携・OAuth | Spotify OAuth 設定 |
| VOICEVOX / COEIROINK | テキスト読み上げ (音声合成) | `API.VOICEVOX`, `API.COEIROINK` (既定: `127.0.0.1:50021`, `127.0.0.1:50022`) |
| Rust ゲームサーバー (rcon) | `/rust whitelist add\|revoke` で whitelist を管理 (`rust.handler.ts` が `rcon` CLI を `execFile` で実行) | `~/rcon.yaml` (rcon CLI の設定ファイル) |

## ボイスチャンネルの E2EE (DAVE)

Discord のボイスチャンネル E2EE (DAVE プロトコル) には `@discordjs/voice` v0.19 + `@snazzah/davey` で対応している (bot の音楽再生・speak の読み上げ共通)。音楽再生はかつての play-dl / ytdl-core / discord-player-plus から youtubei.js (Innertube) に移行済み。

## AI チャットのシステムプロンプト

キャラクター設定のシステムプロンプトは定数として持つ。

| パッケージ | 定数 | 場所 |
|---|---|---|
| bot (みかん) | `CHATBOT_TEMPLATE` | `packages/bot/src/constant/constants.ts` |
| speak (れもん / らいむ) | `CHATBOT_LEMON_TEMPLATE` / `CHATBOT_LIME_TEMPLATE` | `packages/speak/src/constant/constants.ts` |

いずれもプロンプト内に `CONFIG.LITELLM.DEFAULT_MODEL` (動作中のモデル名) を埋め込んでいる。

## Cron ジョブ

| パッケージ | スケジュール | 処理内容 |
|---|---|---|
| bot | `0 0 * * *` (毎日0時) | ガチャの抽選回数を補充 (30 未満なら +10)。あわせてモデル設定を DEFAULT に戻し、ユーザー名を displayName に更新 |
| bot | `* * * * *` (毎分) | 1時間以上アイドル状態のチャットセッションをクリーンアップ |
| speak | `* * * * *` (毎分) | 30分以上アイドル状態の LLM セッションを破棄 |
