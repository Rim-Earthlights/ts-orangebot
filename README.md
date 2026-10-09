# OrangeBot-TS

[TypeScript] Discord Bot for Orange-Server.

pnpm workspace によるモノレポ構成です (`packages/bot` / `packages/shared` / `packages/speak`)。
詳細は [docs/](docs/) を参照してください。

| ドキュメント | 内容 |
|---|---|
| [docs/overview.md](docs/overview.md) | プロジェクト概要・技術スタック・pnpm スクリプト |
| [docs/architecture.md](docs/architecture.md) | ディレクトリ構成・処理フロー・外部 API |
| [docs/configuration.md](docs/configuration.md) | 設定ファイル (`config.ts` / インスタンス別 JSON) |
| [docs/commands.md](docs/commands.md) | コマンド一覧 |
| [docs/database.md](docs/database.md) | DB スキーマ・マイグレーション |
| [docs/issues.md](docs/issues.md) | 既知の課題 |
| [docs/migration-proposal.md](docs/migration-proposal.md) | 構成移行の提案と進捗 |

# Get Ready

1. Node.js (v24 系想定) と pnpm をインストール
2. MariaDB を起動し、データベースとユーザーを作成して権限を付与
3. `pnpm install`
4. Bot の設定ファイルを作成
   - `cp packages/bot/src/config/config.template.ts packages/bot/src/config/config.ts`
   - `config.ts` を編集 (詳細は [docs/configuration.md](docs/configuration.md))
5. マイグレーションを適用: `pnpm --filter @orangebot/shared migration:run` (`packages/shared/.env` に DB 接続情報が必要。[docs/database.md](docs/database.md) 参照)
6. `pnpm dev` で開発モード起動 (nodemon)
7. 本番は `pnpm build` 後に `./start.sh bot` (落ちたら自動再起動)

読み上げ Bot (`packages/speak`) を使う場合:

- `packages/speak/src/config/config.template.ts` を `config.ts` にコピーして編集し、インスタンス別 JSON (`example.json.template` 参照) を用意する
- `./start.sh speak <name>` (例: `./start.sh speak lemon` → `src/config/lemon.json`)
- 音声合成エンジン (VOICEVOX / COEIROINK) は podman Quadlet で動かす。セットアップは [containers/README.md](containers/README.md) を参照 (設置後は `pnpm tts:up` / `tts:down` / `tts:status` で操作)

# config.ts について

- 基本はテンプレートに沿えば大丈夫ですが、DISCORD, DB 設定の入力は必須です。
- 天気 (Forecast)・LLM (LiteLLM)・YouTube の API キーは任意ですが、入力するとその機能が使えるようになります。

# License
### CopyRights
- Copyright (c) 2022-2023 / Rim Earthlights
  - https://twitter.com/Rim_Earthlights
