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
- **状況**: デフォルトが `synchronize: config.synchronize ?? false` に切り替え済みで、スキーマはマイグレーションで管理される。環境別の設定切り替えが無い点は #18 として残る

### 3. 非同期処理の未 await (Promise の握りつぶし) — 部分的に解決

- **場所**: `packages/bot/src/app.ts` の ready イベント内
- **問題**: ユーザーの softDelete / DM チャンネル作成ループは `Promise.all()` で待機するよう修正済み。一方、サーバー登録ループ (`// サーバー登録` の `DISCORD_CLIENT.guilds.cache.map(async ...)`) とコマンド登録ループ (`// コマンド登録` の `guilds.map(async ...)`) は依然として await されていない
- **対策**: 残りのループも `Promise.all()` で非同期処理を正しく待機する

### 4. テストが存在しない (解決済み — Phase 2)

- **場所**: プロジェクト全体
- **状況**: Vitest 導入済み。ルートに `pnpm test` / `pnpm test:integration`、`packages/shared/test/` にサービス・リポジトリのユニットテストとインテグレーションテスト (`migration.test.ts` / `repository.test.ts` 等) が存在する
- **残課題**: `packages/bot` 側 (ハンドラ・アダプタ層) のテスト拡充

---

## 優先度: High

### 5. ハードコードされた Discord ID

- **場所**: `packages/bot/src/app.ts`, `packages/bot/src/bot/reactions.ts`, `packages/bot/src/bot/dot_function/chat_tools/userActivity.ts`, `packages/bot/src/bot/manager/handlers/interactions/lyrics.handler.ts`, `packages/bot/src/bot/dot_function/speak.ts`, `packages/bot/src/config/config.ts`
- **問題**: チャンネル ID やギルド ID がソースコードに直接埋め込まれている
  - `'1020972071460814868'`, `'1239718107073875978'`, `'1017341244508225596'` 等
  - `speak.ts` には読み上げ Bot のユーザー ID (`LEMON_SPEAKER_ID` / `LIME_SPEAKER_ID`) と呼出先 URI (`http://127.0.0.1:4100` 等) もハードコード
- **対策**: 設定ファイルまたは DB のギルド設定に移動

### 6. イベントハンドラに try/catch がない

- **場所**: `packages/bot/src/app.ts` (`messageCreate` イベント等)
- **問題**: ハンドラ内で例外が発生するとイベント処理全体が停止し、Bot が無応答になる可能性
- **対策**: 各イベントハンドラのトップレベルに try/catch を追加

### 7. エンドポイントの入力値バリデーションがない

- **場所**: `packages/bot/src/controller/chatRouter.ts`, `packages/bot/src/controller/musicRouter.ts` 等
- **問題**: `parseInt(req.query.limit as string)` のように型変換のみで、範囲チェック・形式チェックがない
- **対策**: zod や express-validator 等のバリデーションライブラリを導入

### 8. CORS が全オリジン許可

- **場所**: `packages/bot/src/app.ts` (`app.use(cors())`)
- **問題**: `app.use(cors())` で全オリジンからのリクエストを許可
- **対策**: 許可するオリジンを明示的に指定

### 9. DB コネクションプール設定がない

- **場所**: `packages/shared/src/config/datasource.ts`
- **問題**: MariaDB のプール設定がデフォルトのまま。並行リクエスト増加時にコネクション枯渇の恐れ
- **対策**: `poolSize`, `maxConnections`, `minConnections` を明示的に設定

### 10. グレースフルシャットダウンが未実装

- **場所**: `packages/bot/src/app.ts`
- **問題**: プロセス終了時に DB 接続や Discord クライアントの後処理がない
- **対策**: `SIGTERM` / `SIGINT` ハンドラで `dataSource.destroy()` と `client.destroy()` を実行

### 11. ログ出力が不統一

- **場所**: プロジェクト全体
- **問題**: `Logger.put()` (静的メソッド)、インスタンスメソッド `.info()` / `.error()`、素の `console.log` / `console.error` が混在
- **対策**: ログ方式を統一し、構造化ログ (Winston, Pino 等) の導入を検討

---

## 優先度: Medium

### 12. チャットアダプタが肥大化 (God Class)

- **場所**: `packages/bot/src/bot/adapters/chat.adapter.ts` (約340行。旧 `dot_function/chat.ts` は再エクスポートのみのスタブに移行済み — Phase 2-3)
- **問題**: ファイル処理、LLM 呼び出し、Tool Calling 実行、ログ、メッセージフォーマットなど多くの責務を持つ。Tool Calling 化により一部は `chat_tools/`・`chat_attachments.ts` に分離済みだが、本体は依然として大きい
- **対策**: 責務ごとにさらに分割 (Embed 整形 / セッション管理 / ツール実行等)

### 13. LLM 呼び出しの抽象化がない

- **場所**: `packages/shared/src/services/chat.service.ts`, `packages/bot/src/bot/adapters/chat.adapter.ts`
- **問題**: OpenAI クライアント (`new OpenAI(...)`) の生成・呼び出しがサービス/アダプタに直接埋め込まれており、プロバイダ変更やテストが困難。なお旧参照先の `packages/bot/src/bot/request/openai.ts` は空ファイルとして残っており削除候補
- **対策**: LLMProvider インターフェースを作成し、実装を差し替え可能にする

### 14. 未使用の依存関係 (対応済み)

- **場所**: `packages/bot/package.json`
- **状況**: `@sequelize/core` / `fs` (0.0.1-security) / `kysely` / `sqlite3` / `pg` / `pg-hstore` は既に削除済み。新たに不要な依存が混入していないかは定期的にチェックしたい

### 15. 設定値のバリデーションがない

- **場所**: `packages/bot/src/app.ts` 起動時
- **問題**: 必須の設定値 (Discord Token, DB接続情報等) が未設定でも起動を試みて不明瞭なエラーになる
- **対策**: 起動時に設定値をチェックし、不足があれば明確なエラーメッセージで終了

### 16. ソフトデリートのカスケードがない

- **場所**: `packages/shared/src/repository/usersRepository.ts`
- **問題**: ユーザーをソフトデリートしても、関連する gacha / settings レコードが残り、クエリ不整合の原因になる
- **対策**: カスケードソフトデリートロジックの実装、またはリレーション設定の見直し

### 17. DB インデックスの不足

- **場所**: `packages/shared/src/models/*.ts`
- **問題**: `user_id`, `guild_id`, `channel_id` 等の頻出検索カラムにインデックスが未設定の可能性
- **対策**: 頻繁にクエリされるカラムに `@Index()` デコレータを追加

### 18. 環境別の設定切り替えがない

- **場所**: `packages/bot/src/config/config.template.ts`, `packages/shared/src/config/datasource.ts`
- **問題**: `NODE_ENV` による設定の切り替え機構がなく、開発/本番で同じ設定が適用される
- **対策**: 環境変数ベースの設定切り替えを実装

---

## サマリ

| 優先度 | 件数 | 主な領域 |
|---|---|---|
| Critical | 4 (うち #2 #4 は解決済み、#3 は部分解決) | 認証、DB安全性、非同期処理、テスト |
| High | 7 | セキュリティ、エラーハンドリング、運用 |
| Medium | 7 | アーキテクチャ、コード品質、依存関係 (#14 は対応済み) |
