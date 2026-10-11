# 課題一覧

## 優先度: Critical

### 1. HTTP エンドポイントに認証がない

- **場所**: `packages/bot/src/controller/*.ts` (全ルーター)
- **問題**: すべての Express エンドポイントに認証ミドルウェアが存在しない
  - `/message` POST で任意の Discord チャンネル/ユーザーにメッセージ送信可能
  - `/chat/history` でチャット履歴の取得・削除が認証なしで可能
  - `/gacha`, `/music` 等も同様
- **対策**: JWT やAPIキー検証等の認証ミドルウェアを全エンドポイントに追加

### 2. `synchronize: true` が本番環境でも有効 (解決済み — Phase 2-1)

- **場所**: `packages/shared/src/config/datasource.ts` (`createDataSource`)
- **状況**: デフォルトが `synchronize: config.synchronize ?? false` に切り替え済みで、スキーマはマイグレーションで管理される。環境別の設定切り替えが無い点は #20 として残る

### 3. 非同期処理の未 await (Promise の握りつぶし) (解決済み)

- **場所**: `packages/bot/src/app.ts` / `packages/speak/src/app.ts` の ready イベント内
- **状況**: サーバー登録・コマンド登録・DM 用コマンド登録・読み上げ Bot 登録のループをすべて `Promise.all()` で待機するよう修正済み。ギルドごとの処理は `withErrorLog` で包み、1 ギルドの失敗が他のギルドや後続処理を止めないようにしている

### 4. テストが存在しない (shared は解決済み — Phase 2 / bot は未着手)

- **CI**: GitHub Actions (`.github/workflows/ci.yml`) で build / lint / ユニットテスト / インテグレーションテストを実行する

- **場所**: プロジェクト全体
- **状況**: Vitest 導入済み。ルートに `pnpm test` / `pnpm test:integration`、`packages/shared/test/` にサービス・リポジトリのユニットテストとインテグレーションテスト (`migration.test.ts` / `repository.test.ts` 等) が存在する
- **残課題**: `packages/bot` のテストは 0 件 (`vitest.config.ts` の `passWithNoTests: true` で通過しているだけ)。`packages/speak` には `test` スクリプト自体が無い。ハンドラ・アダプタ層のテスト作成から着手が必要

### 5. `/accept` に権限チェックがない (解決済み)

- **場所**: `packages/bot/src/bot/manager/handlers/interactions/accept.handler.ts`
- **問題**: ADMIN / OWNER 判定が無く、任意のメンバーが任意のユーザーに `member` ロールを付与できる。Bot 内のヘルプ (`chat_tools/commands.ts`) では「OWNER向け」と案内されており、意図と実装が食い違っている
- **状況**: `user-type` / `term` と同様に、実行者が OWNER でなければ拒否するよう修正済み

---

## 優先度: High

### 6. ハードコードされた Discord ID

- **場所**: `packages/bot/src/app.ts`, `packages/bot/src/bot/reactions.ts`, `packages/bot/src/bot/dot_function/chat_tools/userActivity.ts`, `packages/bot/src/bot/manager/handlers/interactions/lyrics.handler.ts`, `packages/bot/src/bot/dot_function/speak.ts`, `packages/bot/src/bot/function/speak.ts`, `packages/bot/src/config/config.ts` (gitignore 対象のローカル設定)
- **問題**: チャンネル ID やギルド ID がソースコードに直接埋め込まれている
  - `'1020972071460814868'`, `'1510840474032803973'` (app.ts の自動応答チャンネル), `'1239718107073875978'`, `'1017341244508225596'` 等
  - `dot_function/speak.ts` と `function/speak.ts` の両方に、読み上げ Bot のユーザー ID (`LEMON_SPEAKER_ID` / `LIME_SPEAKER_ID`) と呼出先 URI (`http://127.0.0.1:4100` 等) が重複してハードコードされている
- **対策**: 設定ファイルまたは DB のギルド設定に移動。speak 呼び出しの定数は 1 箇所に集約する

### 7. イベントハンドラに try/catch がない (解決済み)

- **場所**: `packages/bot/src/app.ts`, `packages/speak/src/app.ts`
- **状況**: すべてのイベントハンドラを `withErrorLog` (`@orangebot/shared`) で包み、例外は ERROR ログに残してプロセスを継続する。Discord クライアントの `error` イベントと、catch されなかった Promise の reject もログに残す。DB 初期化や Discord へのログインに失敗した場合はプロセスを終了する

### 8. エンドポイントの入力値バリデーションがない

- **場所**: `packages/bot/src/controller/chatRouter.ts`, `packages/bot/src/controller/gachaRouter.ts`, `packages/bot/src/controller/musicRouter.ts` 等
- **問題**: `parseInt(req.query.limit as string)` のように型変換のみで、範囲チェック・形式チェックがない (`gachaRouter` はクエリ未指定時に `.toLowerCase()` で例外になる箇所もある)
- **対策**: zod や express-validator 等のバリデーションライブラリを導入

### 9. CORS が全オリジン許可

- **場所**: `packages/bot/src/app.ts` (`app.use(cors())`)
- **問題**: `app.use(cors())` で全オリジンからのリクエストを許可
- **対策**: 許可するオリジンを明示的に指定

### 10. DB コネクションプール設定がない

- **場所**: `packages/shared/src/config/datasource.ts`
- **問題**: MariaDB のプール設定がデフォルトのまま。並行リクエスト増加時にコネクション枯渇の恐れ
- **対策**: `poolSize`, `maxConnections`, `minConnections` を明示的に設定

### 11. グレースフルシャットダウンが未実装 (解決済み)

- **場所**: `packages/bot/src/app.ts`, `packages/speak/src/app.ts`
- **状況**: `SIGTERM` / `SIGINT` を受けると、HTTP サーバー → ボイス接続 → Discord クライアント → DB 接続の順に後処理してから終了する (`registerGracefulShutdown`)。10 秒以内に終わらなければ強制終了する

### 12. ログ出力が不統一

- **場所**: プロジェクト全体
- **問題**: `Logger.put()` (静的メソッド)、インスタンスメソッド `.info()` / `.error()`、素の `console.log` / `console.error` が混在
- **対策**: ログ方式を統一し、構造化ログ (Winston, Pino 等) の導入を検討

### 13. 登録済みだが動作しないコマンド (解決済み)

- **場所**: `packages/bot/src/constant/slashCommands.ts`, `packages/bot/src/bot/manager/interaction.manager.ts`, `packages/speak/src/app.ts`, `packages/speak/src/bot/commands.ts`
- **問題**:
  - `/ai start` / `/ai stop` はスラッシュコマンドとして登録されているが、`interaction.manager.ts` に `'ai'` のハンドラが無く「コマンドが見つかりませんでした。」になる
  - speak の `/spcon` は DM コマンドとしてのみ登録されているが、ハンドラが `deferReply()` 後に `if (!interaction.guild) return;` で抜けるため、DM では応答が返らない
- **状況**: `/ai` は仮実装 (`function/vchat.ts`) 向けだったため、スラッシュコマンドの登録を削除。`/spcon` はギルド判定を外し DM でも応答するよう修正済み

---

## 優先度: Medium

### 14. アダプタの肥大化 (God Class)

- **場所**:
  - `packages/bot/src/bot/adapters/music.adapter.ts` (約1020行)
  - `packages/bot/src/bot/adapters/chat.adapter.ts` (約345行。旧 `dot_function/chat.ts` は再エクスポートのみのスタブに移行済み — Phase 2-3)
- **問題**:
  - music.adapter は再生制御・キュー表示・プレイリスト操作・Embed 整形を 1 ファイルに抱えており、最も肥大化している
  - chat.adapter はファイル処理、LLM 呼び出し、Tool Calling 実行、ログ、メッセージフォーマットなど多くの責務を持つ。Tool Calling 化により一部は `chat_tools/`・`chat_attachments.ts` に分離済みだが、本体は依然として大きい
- **対策**: 責務ごとにさらに分割 (Embed 整形 / セッション管理 / ツール実行 / 再生制御等)

### 15. LLM 呼び出しの抽象化がない

- **場所**: `packages/shared/src/services/chat.service.ts`, `packages/bot/src/bot/adapters/chat.adapter.ts`, `packages/speak/src/bot/service/chatService.ts`
- **問題**: OpenAI SDK クライアント (`new OpenAI(...)`、接続先は `CONFIG.LITELLM`) の生成・呼び出しがサービス/アダプタに直接埋め込まれており、プロバイダ変更やテストが困難
- **対策**: LLMProvider インターフェースを作成し、実装を差し替え可能にする

### 16. 未使用の依存関係・依存の配置

- **場所**: `packages/bot/package.json`, `packages/speak/package.json`, `packages/shared/package.json`, `.npmrc`
- **状況**: `@sequelize/core` / `fs` (0.0.1-security) / `kysely` / `sqlite3` / `pg` / `pg-hstore` は削除済みだが、再び未使用依存が残っている
- **問題**:
  - bot で import されていない: `passport`, `passport-jwt`, `passport-local`, `@types/passport`, `@types/react`, `@types/vue`, `@types/typescript`, `@types/sharp` (sharp は型を同梱)
  - `mariadb` (bot / speak): TypeORM の `type: 'mariadb'` は `mysql2` ドライバを使うため、`mariadb` パッケージは読み込まれない
  - `@orangebot/shared` は DB ドライバ `mysql2` を依存に宣言しておらず、`.npmrc` の `shamefully-hoist=true` によって解決されている (phantom dependency)
  - `prettier` / `nodemon` / `ts-node` / `typescript` / `@types/*` が `dependencies` に置かれている
- **対策**: 未使用依存を削除し、shared に `mysql2` を追加、開発用ツールは `devDependencies` に移す。その上で `shamefully-hoist` の解除を検討する

### 17. 設定値のバリデーションがない (解決済み)

- **場所**: `packages/bot/src/app.ts`, `packages/speak/src/app.ts` 起動時
- **状況**: Discord Token / App ID / DB 接続情報 (speak は PORT も) が空の場合、不足しているキー名を表示して終了する (`findMissingConfig`)。値の形式 (テンプレートのままのプレースホルダー等) までは検査していない

### 18. ソフトデリートのカスケードがない

- **場所**: `packages/shared/src/repository/usersRepository.ts`
- **問題**: ユーザーをソフトデリートしても、関連する gacha / settings レコードが残り、クエリ不整合の原因になる
- **対策**: カスケードソフトデリートロジックの実装、またはリレーション設定の見直し

### 19. DB インデックスの不足

- **場所**: `packages/shared/src/models/*.ts`
- **問題**: `@Index()` は 1 つも定義されていない。ただし `guild_id` / `user_id` / `item_id` / `bot_id` 等の外部キー列は InitialSchema マイグレーションの FK 制約により MariaDB が暗黙のインデックスを作成している。インデックスが無いのは `channel_id` などの非 FK の検索カラム
- **対策**: 非 FK で頻繁にクエリされるカラムに `@Index()` デコレータを追加し、マイグレーションを生成

### 20. 環境別の設定切り替えがない

- **場所**: `packages/bot/src/config/config.template.ts`, `packages/shared/src/config/datasource.ts`
- **問題**: `NODE_ENV` による設定の切り替え機構がなく、開発/本番で同じ設定が適用される (ローカルの `config.ts` で `NODE_ENV` をハードコードしている)
- **対策**: 環境変数ベースの設定切り替えを実装

### 21. 未使用の設定キー・デッドコード

- **場所**: `packages/bot/src/config/config.template.ts`, `packages/speak/src/config/config.template.ts`, `packages/bot/src/controller/spotifyRouter.ts`, `packages/bot/src/bot/request/`, `packages/bot/src/bot/manager/interaction.manager.ts`
- **問題**:
  - 設定キー `COMMON.DEV` / `COMMON.USER` / `DISCORD.COMMAND_GUILD_ID` / `GACHA.PICKRATE` / `NICONICO.*` はどこからも読まれておらず、設定しても効果がない (未使用だった `FLUSH` はテンプレートから削除済み)
  - `spotifyRouter.ts` は `routers.ts` に登録されておらず到達不能
  - `bot/request/openai.ts` / `bot/request/spotify.ts` は空ファイル
  - `interaction.manager.ts` の `dall` / `custom` ハンドラは対応するスラッシュコマンド定義が無く呼び出されない。`commands/chat.handler.ts` の `g3` / `g4` ケースも `message.manager.ts` に登録されていない
- **対策**: 使う予定が無ければ削除する

---

## サマリ

| 優先度 | 件数 | 主な領域 |
|---|---|---|
| Critical | 5 (うち #2 #3 #5 は解決済み、#4 は部分解決) | 認証・権限、DB安全性、非同期処理、テスト |
| High | 8 (うち #7 #11 #13 は解決済み) | セキュリティ、エラーハンドリング、運用、動作しないコマンド |
| Medium | 8 (うち #17 は解決済み) | アーキテクチャ、コード品質、依存関係、デッドコード |
