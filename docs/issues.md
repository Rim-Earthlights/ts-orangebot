# 課題一覧

## 優先度: Critical

### 1. HTTP エンドポイントに認証がない

- **場所**: `src/controller/*.ts` (全ルーター)
- **問題**: すべての Express エンドポイントに認証ミドルウェアが存在しない
  - `/message` POST で任意の Discord チャンネル/ユーザーにメッセージ送信可能
  - `/chat/history` でチャット履歴の取得・削除が認証なしで可能
  - `/gacha`, `/music` 等も同様
- **対策**: JWT やAPIキー検証等の認証ミドルウェアを全エンドポイントに追加

### 2. `synchronize: true` が本番環境でも有効

- **場所**: `src/model/typeorm/typeorm.ts:14`
- **問題**: TypeORM の `synchronize: true` が環境チェックなしで常に有効。スキーマ変更時にカラムやテーブルが自動削除され、データ損失の可能性がある
- **対策**: `NODE_ENV` で切り替え、本番では `false` にしてマイグレーションを使用

### 3. 非同期処理の未 await (Promise の握りつぶし)

- **場所**: `src/app.ts:126-159`
- **問題**: `.map()` 内の async 関数が await されていない
  ```typescript
  DISCORD_CLIENT.guilds.cache.map(async (guild) => {
    await repository.save(...); // Promise.all で包まれていない
  });
  ```
- **対策**: `Promise.all()` で非同期処理を正しく待機する

### 4. テストが存在しない

- **場所**: プロジェクト全体
- **問題**: `package.json` の test スクリプトが `echo "Error: no test specified" && exit 1` のまま。テストコードがゼロ
- **対策**: Jest または Vitest を導入し、主要なサービス・リポジトリのテストを作成

---

## 優先度: High

### 5. ハードコードされた Discord ID

- **場所**: `src/app.ts:260,334`, `src/bot/reactions.ts:58`, `src/bot/dot_function/chat.ts:142`
- **問題**: チャンネル ID やギルド ID がソースコードに直接埋め込まれている
  - `'1020972071460814868'`, `'1239718107073875978'`, `'1017341244508225596'` 等
- **対策**: 設定ファイルまたは DB のギルド設定に移動

### 6. イベントハンドラに try/catch がない

- **場所**: `src/app.ts:186-301` (`messageCreate` イベント等)
- **問題**: ハンドラ内で例外が発生するとイベント処理全体が停止し、Bot が無応答になる可能性
- **対策**: 各イベントハンドラのトップレベルに try/catch を追加

### 7. エンドポイントの入力値バリデーションがない

- **場所**: `src/controller/chatRouter.ts:18-25`, `src/controller/musicRouter.ts:15-31` 等
- **問題**: `parseInt(req.query.limit as string)` のように型変換のみで、範囲チェック・形式チェックがない
- **対策**: zod や express-validator 等のバリデーションライブラリを導入

### 8. CORS が全オリジン許可

- **場所**: `src/app.ts`
- **問題**: `app.use(cors())` で全オリジンからのリクエストを許可
- **対策**: 許可するオリジンを明示的に指定

### 9. DB コネクションプール設定がない

- **場所**: `src/model/typeorm/typeorm.ts`
- **問題**: MariaDB のプール設定がデフォルトのまま。並行リクエスト増加時にコネクション枯渇の恐れ
- **対策**: `poolSize`, `maxConnections`, `minConnections` を明示的に設定

### 10. グレースフルシャットダウンが未実装

- **場所**: `src/app.ts`
- **問題**: プロセス終了時に DB 接続や Discord クライアントの後処理がない
- **対策**: `SIGTERM` / `SIGINT` ハンドラで `dataSource.destroy()` と `client.destroy()` を実行

### 11. ログ出力が不統一

- **場所**: プロジェクト全体
- **問題**: `Logger.put()` (静的メソッド)、インスタンスメソッド `.info()` / `.error()`、素の `console.log` / `console.error` が混在
- **対策**: ログ方式を統一し、構造化ログ (Winston, Pino 等) の導入を検討

---

## 優先度: Medium

### 12. chat.ts が肥大化 (God Class)

- **場所**: `src/bot/dot_function/chat.ts` (388行)
- **問題**: 天気予報、ファイル処理、LLM 呼び出し、ログ、メッセージフォーマットなど多くの責務を持つ
- **対策**: ChatService, WeatherService, FileProcessingService 等に分割

### 13. LLM 呼び出しの抽象化がない

- **場所**: `src/bot/dot_function/chat.ts:233-237`
- **問題**: OpenAI API 呼び出しがビジネスロジックに直接埋め込まれており、プロバイダ変更やテストが困難
- **対策**: LLMProvider インターフェースを作成し、実装を差し替え可能にする

### 14. 未使用の依存関係

- **場所**: `package.json`
- **問題**:
  - `@sequelize/core` v7 alpha がインストールされているが、実際は TypeORM を使用
  - `fs: 0.0.1-security` はネイティブ `fs` で代替可能
- **対策**: `npm prune` で未使用パッケージを削除

### 15. 設定値のバリデーションがない

- **場所**: `src/app.ts` 起動時
- **問題**: 必須の設定値 (Discord Token, DB接続情報等) が未設定でも起動を試みて不明瞭なエラーになる
- **対策**: 起動時に設定値をチェックし、不足があれば明確なエラーメッセージで終了

### 16. ソフトデリートのカスケードがない

- **場所**: `src/model/repository/usersRepository.ts:93-95`
- **問題**: ユーザーをソフトデリートしても、関連する gacha / settings レコードが残り、クエリ不整合の原因になる
- **対策**: カスケードソフトデリートロジックの実装、またはリレーション設定の見直し

### 17. DB インデックスの不足

- **場所**: `src/model/models/*.ts`
- **問題**: `user_id`, `guild_id`, `channel_id` 等の頻出検索カラムにインデックスが未設定の可能性
- **対策**: 頻繁にクエリされるカラムに `@Index()` デコレータを追加

### 18. 環境別の設定切り替えがない

- **場所**: `src/config/config.template.ts`, `src/model/typeorm/typeorm.ts`
- **問題**: `NODE_ENV` による設定の切り替え機構がなく、開発/本番で同じ設定が適用される
- **対策**: 環境変数ベースの設定切り替えを実装

---

## サマリ

| 優先度 | 件数 | 主な領域 |
|---|---|---|
| Critical | 4 | 認証、DB安全性、非同期処理、テスト |
| High | 7 | セキュリティ、エラーハンドリング、運用 |
| Medium | 7 | アーキテクチャ、コード品質、依存関係 |
