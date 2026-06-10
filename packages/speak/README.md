# @orangebot/speak

- Speak TextMessage for Discord (VOICEVOX / Coeiro)
- `@orangebot/bot` から HTTP (`/speaker/call`, `/speaker/status/:guildId`) で呼び出される読み上げボット。
  インスタンスごとに別の Discord トークン / ポートを JSON で渡して複数起動する (例: lemon=4100, lime=4101)。

# Get Ready

1. リポジトリルートで `pnpm install`
2. MySQL (MariaDB) を起動し、データベースとユーザーを作成 (bot と共通)
3. `cp src/config/config.template.ts src/config/config.ts` して DB / OpenAI 設定を記入
4. `cp src/config/example.json.template src/config/<name>.json` してインスタンス別の TOKEN / APP_ID / NAME / PORT を記入
5. [voicevox_engine](https://github.com/VOICEVOX/voicevox_engine) を起動 (port 50021)

# Run

- 開発: `pnpm --filter @orangebot/speak dev` (src/config/dev.json を使用)
- ビルド: `pnpm --filter @orangebot/speak build`
- 本番: `pnpm --filter @orangebot/speak start src/config/<name>.json`

`config.ts` (DB/OpenAI 共通設定) と `src/config/*.json` (インスタンス別設定) はどちらも gitignore されているため、デプロイ先で旧 speak-voicevox の設定から移行すること。
