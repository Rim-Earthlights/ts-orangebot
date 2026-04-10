# 設定ガイド

## 設定ファイル

設定テンプレートは `src/config/config.template.ts` にあります。これをコピーして `config.ts` を作成し、各値を環境に合わせて設定してください。

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

### OPENAI - AI チャット設定

| キー | 型 | 説明 |
|---|---|---|
| `BASE_URL` | string | LiteLLM プロキシの URL |
| `ORG` | string \| undefined | OpenAI Organization ID |
| `PROJECT` | string \| undefined | OpenAI Project ID |
| `KEY` | string | API キー |
| `DEFAULT_MODEL` | LiteLLMModel | デフォルトモデル |
| `G3_MODEL` | LiteLLMModel | 軽量モデル (low) |
| `G4_MODEL` | LiteLLMModel | 高性能モデル (high) |
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

LiteLLM プロキシを経由して以下のモデルが利用可能です:

**GPT 系:**
- GPT-4.1 / GPT-4.1 Mini / GPT-4.1 Nano
- GPT-4o / GPT-4o Mini
- GPT-4.5 Preview
- GPT-o1 / GPT-o3 Mini

**Claude 系:**
- Claude 3.5 Sonnet / Claude 3.5 Haiku
- Claude 3.7 Sonnet / Claude 3.7 Sonnet Reasoning

## Web API エンドポイント

Express サーバーが以下のエンドポイントを提供します:

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/` | ヘルスチェック |
| POST | `/messaging/*` | メッセージルーティング |
| POST | `/chat/*` | チャット操作 |
| POST | `/gacha/*` | ガチャシステム |
| POST | `/music/*` | 音楽制御 |
| POST | `/speaker/*` | TTS 設定 |
| POST | `/session/*` | セッション管理 |
| POST | `/spotify/callback` | Spotify OAuth コールバック |
