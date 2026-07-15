# 設定ガイド

## Bot (`packages/bot`) の設定

設定テンプレートは `packages/bot/src/config/config.template.ts` にあります。これをコピーして `config.ts` を作成し、各値を環境に合わせて設定してください。

## 設定項目

### COMMON - 共通設定

| キー | 型 | 説明 |
|---|---|---|
| `DEV` | boolean | 開発モードフラグ |
| `HOSTNAME` | string | ホスト名 |
| `PORT` | number | ポート番号 |
| `HOST_URL` | string | ホスト URL |
| `USER` | string | ユーザー名 |

### DISCORD - Discord 設定

| キー | 型 | 説明 |
|---|---|---|
| `APP_ID` | string | Discord アプリケーション ID |
| `COMMAND_GUILD_ID` | string[] | コマンドを登録するギルド ID の配列 |
| `TOKEN` | string | Discord Bot トークン |

### GACHA - ガチャ設定

| キー | 型 | 説明 |
|---|---|---|
| `PICKRATE` | number | ガチャの排出率 |

### FORECAST - 天気予報設定

| キー | 型 | 説明 |
|---|---|---|
| `KEY` | string | OpenWeatherMap API キー |

### YOUTUBE - YouTube 設定

| キー | 型 | 説明 |
|---|---|---|
| `KEY` | string | Google Cloud API キー (YouTube Data API) |
| `COOKIE` | string | youtubei.js 用のログイン済み Cookie (音楽再生。任意) |

### OPENAI - AI チャット設定

| キー | 型 | 説明 |
|---|---|---|
| `BASE_URL` | string | LiteLLM プロキシの URL |
| `ORG` | string \| undefined | OpenAI Organization ID |
| `PROJECT` | string \| undefined | OpenAI Project ID |
| `KEY` | string | API キー |
| `DEFAULT_MODEL` | LiteLLMModel | デフォルトモデル |
| `LOW_MODEL` | LiteLLMModel | 軽量モデル (low) |
| `HIGH_MODEL` | LiteLLMModel | 高性能モデル (high) |
| `ACCESSTOKEN` | string | アクセストークン |

### NICONICO - ニコニコ動画設定

| キー | 型 | 説明 |
|---|---|---|
| `ENABLE` | boolean | 有効フラグ |
| `MAIL` | string | ログインメール |
| `PASSWORD` | string | ログインパスワード |

### DB - データベース設定

| キー | 型 | 説明 |
|---|---|---|
| `HOSTNAME` | string | DB ホスト名 |
| `USERNAME` | string | DB ユーザー名 |
| `DATABASE` | string | DB 名 |
| `PASSWORD` | string | DB パスワード |
| `PORT` | number | DB ポート番号 |
| `FLUSH` | boolean | 起動時にスキーマをリセット |

## 対応 AI モデル (LiteLLM)

LiteLLM プロキシを経由して利用します。利用可能なモデルの定義は bot と speak で別々に管理されています。

### Bot (`packages/bot` の `LiteLLMModel` enum)

**GPT 系:**
- GPT-4.1 / GPT-4.1 Mini / GPT-4.1 Nano
- GPT-4o / GPT-4o Mini
- GPT-4.5 Preview
- GPT-o1 / GPT-o3 Mini

**Claude 系:**
- Claude 3.5 Sonnet / Claude 3.5 Haiku
- Claude 3.7 Sonnet / Claude 3.7 Sonnet Reasoning

### 読み上げ Bot (`packages/speak` の `LITELLM_MODEL` 定数)

**GPT 系:**
- GPT-4o (latest)
- GPT-5 / GPT-5.1 / GPT-5.2 / GPT-5.4
- GPT-5 Thinking / GPT-5 Mini / GPT-5 Nano

**Claude 系:**
- Claude Sonnet 4.5 / Claude Sonnet 4.6
- Claude Opus 4.6

**Grok 系:**
- Grok 4 / Grok 4 Fast (non-reasoning)

デフォルトモデルは Claude Sonnet 4.6 (`DEFAULT_MODEL: LITELLM_MODEL.CLAUDE_4_6_SONNET`) です。

## 読み上げ Bot (`packages/speak`) の設定

speak は 2 種類の設定ファイルを使います。どちらも gitignore されています。

1. **共通設定** — `packages/speak/src/config/config.template.ts` をコピーして `config.ts` を作成し、DB (bot と共通) / OpenAI の設定を記入
2. **インスタンス別設定** — `src/config/example.json.template` をコピーして `src/config/<name>.json` を作成し、起動引数で渡す

インスタンス別 JSON の項目:

| キー | 型 | 説明 |
|---|---|---|
| `TOKEN` | string | そのインスタンスの Discord Bot トークン |
| `APP_ID` | string | Discord アプリケーション ID |
| `NAME` | string | Bot 名 (`.{NAME} <text>` で LLM チャットにも使用) |
| `PORT` | number | HTTP サーバーのポート (例: lemon=4100, lime=4101) |
| `COMMAND.SPEAK` | object | 読み上げ呼出コマンド名・スリープ時間 |
| `COMMAND.SPEAKER_CONFIG` | object | 読み上げ設定コマンド (`speaker-config` / `spcon` / `sp-reload`) |
| `COMMAND.DISCONNECT` | string | 切断コマンド名 (`discon`) |

また、音声合成のため [voicevox_engine](https://github.com/VOICEVOX/voicevox_engine) (port 50021)、COEIROINK を使う場合はそのエンジン (port 50032) をローカルで起動しておく必要があります。

## Web API エンドポイント

### Bot (`packages/bot`)

Express サーバーが以下のエンドポイントを提供します:

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/` | ヘルスチェック (JSON) |
| POST | `/message` | 指定ユーザー / チャンネルへのメッセージ送信 (JSON) |
| GET | `/gacha` | ガチャ結果の表示 (EJS) |
| GET | `/gacha/history` | プレゼント履歴の表示 (EJS) |
| GET | `/music` | 再生キューの表示 (EJS) |
| GET | `/speakers` | TTS 話者一覧の表示 (EJS) |
| GET | `/session` | セッショントークンの取得 (JSON) |
| GET | `/chat/history` | チャット履歴一覧の表示 (EJS) |
| GET | `/chat/history/:uuid` | チャット履歴詳細の表示 (EJS) |
| DELETE | `/chat/history/:uuid` | チャット履歴の削除 (JSON) |

※ `controller/spotifyRouter.ts` (POST `/spotify/callback`) も存在しますが、`routers.ts` に登録されておらず現在は無効です。

### 読み上げ Bot (`packages/speak`)

bot から呼び出される HTTP API:

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/speaker/status/:guildId` | 読み上げ Bot の使用状況を取得 |
| POST | `/speaker/call` | ボイスチャンネルに読み上げ Bot を呼び出す |
| POST | `/speaker/discon` | 読み上げ Bot を切断する |
