# 設定ガイド

## Bot (`packages/bot`) の設定

設定テンプレートは `packages/bot/src/config/config.template.ts` にあります。これをコピーして `config.ts` を作成し、各値を環境に合わせて設定してください。

## 設定項目

> 以前のテンプレートにあった `COMMON.DEV` / `COMMON.USER` / `DISCORD.COMMAND_GUILD_ID` / `GACHA.PICKRATE` / `NICONICO.*` はコードから参照されていなかったため削除しました。既存の `config.ts` に残っていても動作は変わりません (削除して構いません)。

### COMMON - 共通設定

| キー | 型 | 説明 |
|---|---|---|
| `HOSTNAME` | string | ホスト名 |
| `PORT` | number | ポート番号 |
| `HOST_URL` | string | ホスト URL |

### DISCORD - Discord 設定

| キー | 型 | 説明 |
|---|---|---|
| `APP_ID` | string | Discord アプリケーション ID |
| `TOKEN` | string | Discord Bot トークン |

### API - 音声合成エンジン接続先

| キー | 型 | 説明 |
|---|---|---|
| `VOICEVOX` | string | VOICEVOX エンジンの URL (既定: `http://127.0.0.1:50021/`) |
| `COEIROINK` | string | COEIROINK エンジンの URL (既定: `http://127.0.0.1:50022/`) |

既存の `config.ts` に `API` が無い場合は、従来ソースに決め打ちしていた
`http://127.0.0.1:50021` / `http://127.0.0.1:50022` にフォールバックします
(`packages/bot/src/config/api.ts`)。

### FORECAST - 天気予報設定

| キー | 型 | 説明 |
|---|---|---|
| `KEY` | string | OpenWeatherMap API キー |

### YOUTUBE - YouTube 設定

| キー | 型 | 説明 |
|---|---|---|
| `KEY` | string | Google Cloud API キー (YouTube Data API) |
| `COOKIE` | string | youtubei.js 用のログイン済み Cookie (音楽再生。任意) |

### LITELLM - AI チャット設定

> 旧名は `OPENAI` です。既存の `config.ts` を使っている場合は `OPENAI:` を `LITELLM:` にリネームしてください (リネームしないとビルドが通りません)。

| キー | 型 | 説明 |
|---|---|---|
| `BASE_URL` | string | LiteLLM プロキシの URL |
| `ORG` | string \| undefined | Organization ID (任意) |
| `PROJECT` | string \| undefined | Project ID (任意) |
| `KEY` | string | API キー |
| `DEFAULT_MODEL` | LiteLLMModel | デフォルトモデル |
| `LOW_MODEL` | LiteLLMModel | 軽量モデル (`.model g3` / DM `/model low`) |
| `HIGH_MODEL` | LiteLLMModel | 高性能モデル (`.model g4` / DM `/model high`) |
| `ACCESSTOKEN` | string | アクセストークン |

### DB - データベース設定

| キー | 型 | 説明 |
|---|---|---|
| `HOSTNAME` | string | DB ホスト名 |
| `USERNAME` | string | DB ユーザー名 |
| `DATABASE` | string | DB 名 |
| `PASSWORD` | string | DB パスワード |
| `PORT` | number | DB ポート番号 |

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

1. **共通設定** — `packages/speak/src/config/config.template.ts` をコピーして `config.ts` を作成し、`DB` (bot と共通) / `LITELLM` / `API` (音声合成エンジンの接続先) の設定を記入。テンプレート内の `TOKEN` / `APP_ID` / `NAME` / `PORT` / `COMMAND` は起動時にインスタンス別 JSON の値で上書きされるため、プレースホルダのままでよい
2. **インスタンス別設定** — `src/config/example.json.template` をコピーして `src/config/<name>.json` を作成し、起動引数で渡す

`pnpm dev:speak` は `src/config/dev.json` を読み込むので、開発時は `example.json.template` をコピーして `dev.json` を作成してください。本番は systemd の `orangebot-speak@<name>` ユニット (`src/config/<name>.json`) で起動します ([systemd/README.md](../systemd/README.md) 参照)。

speak の `LITELLM` 項目:

| キー | 型 | 説明 |
|---|---|---|
| `BASE_URL` | string | LiteLLM プロキシの URL |
| `ORG` | string | Organization ID (任意) |
| `PROJECT` | string | Project ID (任意) |
| `KEY` | string | API キー |
| `DEFAULT_MODEL` | LITELLM_MODEL | 使用モデル (既定: `LITELLM_MODEL.CLAUDE_4_6_SONNET`) |

インスタンス別 JSON の項目:

| キー | 型 | 説明 |
|---|---|---|
| `TOKEN` | string | そのインスタンスの Discord Bot トークン |
| `APP_ID` | string | Discord アプリケーション ID |
| `NAME` | string | Bot 名 (`.{NAME} <text>` で LLM チャットにも使用) |
| `PORT` | number | HTTP サーバーのポート (例: lemon=4100, lime=4101) |
| `COMMAND.SPEAK` | object | 読み上げ呼出コマンド名 (`COMMAND_NAME`)・スリープ時間 (`SLEEP_TIME`)。型定義 `CommandConfig` には `SLASH_COMMAND_NAME` もあるが、テンプレートには無くコードからも参照されない |
| `COMMAND.SPEAKER_CONFIG` | object | 読み上げ設定コマンド (`speaker-config` / `spcon` / `sp-reload`) |
| `COMMAND.DISCONNECT` | string | 切断コマンド名 (`discon`) |

また、音声合成エンジンが必要です。標準の接続先は VOICEVOX が `http://127.0.0.1:50021/`、COEIROINK が `http://127.0.0.1:50022/` で、共通設定の `API.VOICEVOX` / `API.COEIROINK` で変更できます。

| キー | 型 | 説明 |
|---|---|---|
| `API.VOICEVOX` | string | VOICEVOX エンジンの URL (既定: `http://127.0.0.1:50021/`) |
| `API.COEIROINK` | string | COEIROINK エンジンの URL (既定: `http://127.0.0.1:50022/`) |

既存の `config.ts` に `API` が無い場合も、上記の既定値にフォールバックします
(`packages/speak/src/config/api.ts`)。

podman で起動する場合は `containers/` に systemd (Quadlet) 用の一式があります。詳細は [containers/README.md](../containers/README.md) を参照してください。

```sh
./containers/coeiroink/build.sh   # COEIROINK は公式イメージがないのでローカルビルド
./containers/install.sh --start
```

COEIROINK コンテナはホストの **50022** で公開されます (エンジン本体の 50032 をコンテナ内で中継)。

## Web API エンドポイント

### Bot (`packages/bot`)

Express サーバーが以下のエンドポイントを提供します:

| メソッド | パス | 説明 | 接続元 |
|---|---|---|---|
| GET | `/` | ヘルスチェック (JSON) | 制限なし |
| POST | `/message` | 指定ユーザー / チャンネルへのメッセージ送信 (JSON) | 同じマシン上のみ |
| GET | `/gacha` | ガチャ結果の表示 (EJS) | 制限なし |
| GET | `/gacha/history` | プレゼント履歴の表示 (EJS) | 制限なし |
| GET | `/music` | 再生キューの表示 (EJS) | 制限なし |
| GET | `/speakers` | TTS 話者一覧の表示 (EJS) | 制限なし |
| GET | `/session` | セッショントークンの取得 (JSON) | 同じマシン上のみ |
| GET | `/chat/history` | チャット履歴一覧の表示 (EJS) | 制限なし |
| GET | `/chat/history/:uuid` | チャット履歴詳細の表示 (EJS) | 制限なし |
| DELETE | `/chat/history/:uuid` | チャット履歴の削除 (JSON) | LAN 内のみ |

「同じマシン上のみ」のエンドポイントには `localOnly` ミドルウェア (`controller/middleware/localOnly.ts`) が付いています。ループバック (`127.0.0.1` / `::1` / `::ffff:127.0.0.1`) 以外からのリクエストと、`X-Forwarded-For` / `X-Real-IP` / `Forwarded` ヘッダが付いたリクエスト (リバースプロキシ経由) は 403 になります。同じマシン上のリバースプロキシで公開する場合は、プロキシ側で必ずこれらのヘッダを付けてください。認証は Phase 3 / 4 で入れる予定です。

「LAN 内のみ」のエンドポイントには `lanOnly` ミドルウェア (`controller/middleware/lanOnly.ts`) が付いています。ループバック・プライベートアドレス (`10.0.0.0/8` / `172.16.0.0/12` / `192.168.0.0/16` / `fc00::/7`)・リンクローカルアドレス (`169.254.0.0/16` / `fe80::/10`) 以外からのリクエストと、上記のリバースプロキシのヘッダが付いたリクエストは 403 になります。チャット履歴一覧画面の削除ボタンも、同じ条件で LAN 内から開いたときだけ表示します。

### 読み上げ Bot (`packages/speak`)

bot から呼び出される HTTP API:

| メソッド | パス | 説明 | 接続元 |
|---|---|---|---|
| GET | `/speaker/status/:guildId` | 読み上げ Bot の使用状況を取得 | 制限なし |
| POST | `/speaker/call` | ボイスチャンネルに読み上げ Bot を呼び出す | 同じマシン上のみ |
| POST | `/speaker/discon` | 読み上げ Bot を切断する | 同じマシン上のみ |

制限の内容は bot と同じです (`controllers/middleware/localOnly.ts`)。
