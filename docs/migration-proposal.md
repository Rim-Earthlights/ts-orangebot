# 次フェーズ移行提案: モノレポ化 + API サーバー / フロントエンド新設

> **進捗ステータス (2026-10 時点)**:
> - **Phase 1 (モノレポ基盤構築): 完了** — 1-1 〜 1-4 すべて完了。詳細は「4. 移行フェーズ」の Phase 1 節を参照
> - **計画外の追加: `packages/speak` (2026-06)** — 別リポジトリだった speak-voicevox を読み上げ Bot として monorepo に統合。DB 層は `@orangebot/shared` を再利用し、bot からは HTTP (`/speaker/call` 等) で呼び出す。本提案の Phase 構成には影響しない
> - **計画外の追加: TTS エンジンのコンテナ化 (2026-10)** — VOICEVOX / COEIROINK を podman Quadlet (`containers/quadlet/`) で systemd ユーザーサービスとして起動 (`pnpm tts:up`)。Phase 5 の Docker Compose 開発環境とは別物
> - **Phase 2 (サービス層の整備): サービス切り出しは完了、一部の付帯項目は未着手** — 2-1 〜 2-3 のサービス切り出し・アダプター層・テストは完了 (shared のテスト: unit 98件 + integration 16件)。一方、Phase 2 で対応するとしていた「DB 同時アクセスの排他制御」と「エラー型の共通化」(6章) は未着手。bot 側のテストも 0 件
> - **Phase 3 〜 5: 未着手** — `packages/api` / `packages/front` / `docker-compose.yml` / CI (`.github/`) はいずれも未作成
>
> 次の作業は Phase 2 の残項目の消化、または Phase 3 (API サーバー新設)。

## 1. 背景と目的

### 現状

OrangeBot-TS は Discord Bot 単体として動作しており、Express サーバーと Discord クライアントが **単一プロセス** で稼働している。Web UI は EJS テンプレートによる簡易的なもので、認証・バリデーションのない断片的な JSON エンドポイント (`/message`, `/session` 等) はあるものの、体系的な JSON API は存在しない。

### 課題 (詳細は `docs/issues.md` を参照)

- HTTP エンドポイントに認証がない
- ビジネスロジックが Discord.js と密結合しており、Web からの再利用が困難 (Phase 2-3 のサービス/アダプター層整備で大幅に緩和)
- ~~サービス層が未整備~~ → Phase 2 で `@orangebot/shared` の `services/` に 7 サービスを整備済み
- ~~テストがゼロ~~ → Phase 2-1 で Vitest を導入済み (ユニット + インテグレーション)。ただしテストがあるのは shared のみで、bot / speak は 0 件
- Express コントローラが EJS テンプレートに直結し、API として使えない

### 目的

- **API サーバーの新設**: 認証・バリデーション付きの JSON API を提供
- **フロントエンドの新設**: API を利用した SPA による管理画面・ダッシュボード
- **Bot の安定稼働維持**: 既存の Discord Bot 機能を壊さずに段階的に移行

---

## 2. 方針: モノレポによる段階的移行

### なぜリファクタではなく新規 + 共有層切り出しか

| 観点 | リファクタ | 完全新規 | **モノレポ + 段階移行 (推奨)** |
|---|---|---|---|
| Bot の稼働継続 | リスク高 (変更が直接影響) | 問題なし (別プロジェクト) | **問題なし (Bot は分離)** |
| 既存コードの再利用 | 全て活用するが改修が大量 | ゼロから書き直し | **再利用可能な層のみ切り出し** |
| デグレリスク | テストがないため高い | なし | **低い (Bot は最小限の変更)** |
| 開発工数 | 中〜大 | 大 | **中** |
| 技術的負債の解消 | 部分的 | 完全解消 | **新規部分で解消、Bot は後追い** |

### 再利用性の評価

| レイヤー | 再利用率 | 判定 |
|---|---|---|
| TypeORM モデル (17エンティティ) | **95%** | そのまま shared に移動 |
| リポジトリ層 (13ファイル) | **75-90%** | Logger 依存を除けばほぼそのまま |
| 純粋ビジネスロジック (dice.service 等) | **85-100%** | Discord 非依存、そのまま移動 |
| dot_function (gacha, room, chat 等) | **30-40%** | Discord.js 密結合、ロジック抽出が必要 |
| Express コントローラ | **35%** | EJS 直結、JSON API として作り直し |
| マネージャー/ハンドラ | **15%** | Discord イベント専用、再利用不可 |

---

## 3. ターゲット構成

```
ts-orangebot/
├── packages/
│   ├── shared/                     ← 共有層 (既存から切り出し + 新規)
│   │   ├── src/
│   │   │   ├── models/            ← TypeORM エンティティ
│   │   │   ├── repository/        ← データアクセス層
│   │   │   ├── services/          ← ビジネスロジック (★ 新規整備)
│   │   │   ├── types/             ← 共有型定義・DTO
│   │   │   └── config/            ← DB 接続設定等
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── bot/                        ← Discord Bot (既存ベース)
│   │   ├── src/
│   │   │   ├── app.ts             ← Bot エントリーポイント (Express 分離)
│   │   │   └── bot/
│   │   │       ├── manager/       ← メッセージ/インタラクション管理 (handlers/ にコマンドハンドラ)
│   │   │       └── adapters/      ← shared サービスと Discord の橋渡し ✅ 作成済み
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── speak/                      ← 読み上げ Bot (旧 speak-voicevox を統合済み)
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                        ← API サーバー (★ 新規作成)
│   │   ├── src/
│   │   │   ├── app.ts             ← Fastify エントリーポイント
│   │   │   ├── routes/            ← JSON API ルート定義
│   │   │   ├── plugins/           ← 認証 (JWT)、バリデーション等のプラグイン
│   │   │   └── controllers/      ← リクエスト処理
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── front/                      ← フロントエンド (★ 新規作成)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                    ← ワークスペースルート
├── pnpm-workspace.yaml             ← pnpm ワークスペース定義
├── tsconfig.base.json              ← 共通 TypeScript 設定
└── docker-compose.yml              ← 開発環境 (★ 新規・未作成。現状はテスト用の docker-compose.test.yml のみ)
```

### 技術選定

「移行前」列は本提案作成時 (Phase 1 着手前) のスナップショット。パッケージマネージャ (pnpm) とテスト (Vitest)、テスト用 DB コンテナは移行済み。

| 項目 | 移行前 | 移行後 |
|---|---|---|
| パッケージマネージャ | Yarn Classic (v1) | **pnpm** (ワークスペース対応、厳密な依存解決) ✅ 移行済み |
| モジュール | ESNext (ESM) | ESNext (ESM) ← 変更なし |
| TypeScript | 5.8 | 5.8 ← 変更なし |
| DB | MariaDB + TypeORM | MariaDB + TypeORM ← 変更なし |
| API フレームワーク | Express 5 (EJS) | **Fastify** (プラグインによる関心の分離が容易・高パフォーマンス) |
| 認証 | passport (未活用) | **JWT (@fastify/jwt)** |
| バリデーション | なし | **zod** (`fastify-type-provider-zod` で Fastify と統合。shared の DTO バリデーションにも統一的に使用) |
| フロントエンド | EJS テンプレート | **Vue 3 + Vuetify 3** (Vite / Composition API + Material Design コンポーネントにより管理画面を高速に構築) |
| テスト | なし | **Vitest** ✅ 導入済み (Phase 2-1) |
| コンテナ | なし | **Docker Compose** (開発環境) ※ テスト用 DB (`docker-compose.test.yml`) と TTS エンジン (podman Quadlet, `containers/`) は導入済み。開発環境の `docker-compose.yml` は未作成 |

---

## 4. 移行フェーズ

### Phase 1: モノレポ基盤構築 ✅ 完了

各サブフェーズ完了時に smoke test (`pnpm smoke-test`) で Bot の動作確認を行う方針で進めた。

| サブフェーズ | 結果 | 主な決定事項 |
|---|---|---|
| 1-1 パッケージマネージャ移行 | Yarn → pnpm + workspace。未使用依存 (`@sequelize/core` / `fs` / `kysely` / `sqlite3` / `pg` / `pg-hstore`) を削除 | TypeORM・ネイティブモジュール対策として `.npmrc` に `shamefully-hoist=true` を暫定設定 |
| 1-2 モノレポ構成 | `pnpm-workspace.yaml` / `tsconfig.base.json` / `packages/bot` / `packages/shared` / smoke-test スクリプトを作成 | smoke test は DB 接続だけでなくハンドラ登録漏れも検出する |
| 1-3 shared への切り出し | モデル17個・リポジトリ13個・DataSource ファクトリ・Logger ポート (`getLogger` / `setLogger`)・DTO を `@orangebot/shared` に集約 | bot は workspace パッケージ `@orangebot/shared` を import する (path alias は使わない)。Discord 依存のあるリポジトリ処理は bot 側に押し戻す |
| 1-4 ビルド・開発環境整備 | `predev` / `presmoke-test` で shared を先にビルド。TypeORM マイグレーション基盤 (`packages/shared/scripts/data-source-cli.ts` + `migration:*` + `src/migrations/`) を整備 | shared は他パッケージに依存しない。`synchronize: false` への切り替えはテスト基盤導入後 (2-1) に行う |

**計画との差分・残項目**:

- ルートの `dev` は提案の `pnpm -r dev` ではなく、`--filter @orangebot/bot` で bot のみを対象にしている (speak は `pnpm dev:speak`)。`lint` はルートの `eslint.config.mjs` で全パッケージを対象にする。`build` / `clean` / `test` は `pnpm -r`
- `shamefully-hoist=true` は解除されておらず、strict モードへの移行は未着手。shared が `mysql2` を宣言せずに動いている等の phantom dependency が残っている (`docs/issues.md` 参照)

---

### Phase 2: サービス層の整備 ✅ サービス切り出し完了 (付帯項目は一部未着手)

**目的**: ビジネスロジックを Discord 非依存のサービスとして切り出す

**切り出し対象の判断基準**:

| 関数の性質 | 判断 |
|---|---|
| 純粋な計算・抽選ロジック | → shared/services に移動 |
| DB 操作 (CRUD) | → shared/repository のまま |
| Discord メッセージ送信・フォーマット | → `packages/bot/src/bot/adapters/` に残す |
| Discord イベント処理 | → `packages/bot/src/bot/manager/handlers/` に残す |

| サブフェーズ | 結果 |
|---|---|
| 2-1 テスト基盤 + 純粋ロジック | Vitest を shared / bot に導入、テスト用 MariaDB コンテナ (`docker-compose.test.yml` + `pnpm test:db:up`) を整備。`synchronize: false` に切り替え、初期マイグレーション `InitialSchema` を生成してインテグレーションテストで検証 (詳細は `docs/database.md`)。`DiceService` / `PhotoService`・乱数ユーティリティ・定数を shared (`services/` `common/` `constants/`) に移動 |
| 2-2 DB 依存サービス | `GachaService` / `UserService` を新設。入出力は `types/gacha.ts` / `types/user.ts` の DTO、リポジトリはコンストラクタ注入でモック可能。ユニットテスト + リポジトリ層のインテグレーションテストを整備 |
| 2-3 Discord 密結合ロジック + アダプター層 | `ChatService` / `RoomService` / `MusicService` を新設。bot 側に `bot/adapters/` (chat / music / room) を作り、旧 `dot_function/{chat,music,room}.ts` はアダプターへの再エクスポートに変更。`llmList` グローバル状態は ChatService のセッションストアに統合 |

**未着手の残項目**:

- DB 同時アクセスの排他制御 (トランザクション / `@VersionColumn` / `SELECT ... FOR UPDATE`) — 6章参照
- ドメインエラー型の共通化 (`NotFoundError` 等) — 6章参照
- bot 側 (ハンドラ・アダプタ層) のテスト。現状 0 件で `passWithNoTests` により通過している

---

### Phase 3: API サーバー新設

**目的**: 認証・バリデーション付きの JSON API を提供

**作業内容**:

1. `packages/api` プロジェクト作成
   - Fastify セットアップ
   - `@fastify/cors` (オリジン制限あり)、`@fastify/helmet`
2. 認証プラグイン実装
   - **フロントエンド向け (JWT)**:
     - Discord OAuth2 でユーザー認証 → サーバー側で JWT を発行
     - アクセストークン (短命: 15分) + リフレッシュトークン (長命: 7日) の二重構成
     - `@fastify/jwt` で検証・更新
   - **Bot → API 連携用 (API キー)**:
     - 環境変数で共有する事前共有キー方式
     - `X-API-Key` ヘッダで認証
     - キーのローテーションはダウンタイムなしで行えるよう、複数キーの同時受け入れに対応 (環境変数にカンマ区切りで新旧キーを設定し、ローリング更新で切り替え)
3. バリデーション
   - `fastify-type-provider-zod` により zod スキーマで型安全なバリデーション (shared の DTO と統一)
4. API エンドポイント実装
   - shared/services を利用して JSON レスポンスを返す

**想定 API エンドポイント**:

```
# 認証
POST   /api/auth/login
POST   /api/auth/refresh

# ユーザー
GET    /api/users
GET    /api/users/:guildId/:userId
PATCH  /api/users/:guildId/:userId

# ガチャ
GET    /api/gacha/items
GET    /api/gacha/history/:userId
POST   /api/gacha/pull

# 音楽
GET    /api/music/queue/:guildId
POST   /api/music/queue/:guildId
DELETE /api/music/queue/:guildId/:musicId

# チャット
GET    /api/chat/history/:channelId
DELETE /api/chat/history/:uuid

# ギルド
GET    /api/guilds
GET    /api/guilds/:guildId
PATCH  /api/guilds/:guildId/settings

# ルーム
GET    /api/rooms/:guildId
```

5. エラーハンドリング統一
   - 構造化エラーレスポンス (`{ error: { code, message, details } }`)
6. API テスト (Vitest + `fastify.inject()` によるインジェクションテスト)

**成果物**:
- 認証付き JSON API サーバー
- API のインテグレーションテスト
- OpenAPI (Swagger) ドキュメント

---

### Phase 4: フロントエンド新設

**目的**: API を利用した管理画面・ダッシュボードの提供

**作業内容**:

1. `packages/front` プロジェクト作成
   - Vue 3 + Vite
   - Vuetify 3 (Material Design コンポーネントライブラリ)
   - Vue Router + Pinia (状態管理)
2. 認証画面 (ログイン / Discord OAuth2)
3. ダッシュボード
   - ギルド情報・設定
   - ユーザー一覧・管理
   - ガチャアイテム管理・履歴閲覧
   - 音楽キュー確認
   - チャット履歴閲覧
   - ログビューア

**成果物**:
- SPA フロントエンド
- API との結合テスト (API モックサーバー (`msw`) を用いたフロントエンド単体テスト + 実 API に対する E2E テスト)

---

### Phase 5: 統合・運用整備

**目的**: 全パッケージの統合と運用基盤の整備

**作業内容**:

1. Docker Compose による開発環境構築
   - MariaDB コンテナ
   - Bot / API / Front の各コンテナ
2. Bot から旧 Express 層を除去
   - `packages/bot` から EJS テンプレート・旧コントローラを削除
   - Bot は Discord イベント処理のみに専念
3. 構造化ログの統一 (全パッケージで共通)
4. グレースフルシャットダウン実装
5. CI/CD パイプライン
   - lint → test → build → deploy
6. 環境別設定 (`NODE_ENV` による切り替え)
   - `synchronize: false` (本番)
   - CORS オリジン制限
   - ログレベル制御

**成果物**:
- 本番運用可能な統合環境
- CI/CD パイプライン
- 運用ドキュメント

---

## 5. フェーズ別の依存関係

```
Phase 1-1 (pnpm 移行)
  ↓
Phase 1-2 (モノレポ構成 + smoke test)
  ↓
Phase 1-3 (shared 切り出し)
  ↓
Phase 1-4 (ビルド・開発環境整備)
  ↓
Phase 2-1 (テスト基盤 + 純粋ロジック)
  ↓
Phase 2-2 (DB 依存サービス)
  ↓
Phase 2-3 (Discord 密結合ロジック + アダプター層) ←── Bot の既存機能はここまでで安定
  ↓
Phase 3 (API サーバー) ── Phase 4 (フロントエンド) ← 並行開発可能
  ↓                         ↓
  └──────── Phase 5 (統合・運用) ────────┘
```

- Phase 1-1 → 1-2 → 1-3 → 1-4 は順序必須 (各サブフェーズ完了時に smoke test で動作確認)
- Phase 2-1 → 2-2 → 2-3 は順序必須 (各サブフェーズ完了時にユニットテスト + smoke test)
- Phase 1 → 2 は順序必須
- Phase 3 と 4 は並行開発可能 (Phase 3 の最初に OpenAPI スキーマを定義し、フロントエンドはそのスキーマから `msw` 等でモック生成して開発)
- Phase 5 は 3・4 完了後

---

## 6. 移行時の注意事項

### Bot の稼働継続

- Phase 1〜2 の間、Bot は **既存と同じ動作を維持** する
- import パスの変更のみで、ロジックの変更は行わない
- 各フェーズ完了時に Bot の動作確認を必ず実施

### DB の互換性

- TypeORM モデルは shared に移動するが、**スキーマは変更しない**
- Bot と API サーバーは **同じ DB を共有** する
- `synchronize: true` は Phase 2-1 (テスト基盤導入後) で `synchronize: false` に切り替え、以降はマイグレーションで管理

### DB 同時アクセスの考慮

- Bot と API が同時に書き込む可能性のある操作（ガチャ抽選、ユーザー更新等）では、リポジトリ層でトランザクションを使用し、楽観的ロック (`@VersionColumn`) または `SELECT ... FOR UPDATE` による排他制御を行う
- 具体的な対象はサービス層整備 (Phase 2) で洗い出し、リポジトリ層のメソッド単位で対応する
- **状況: 未着手** — リポジトリ層にトランザクション・`@VersionColumn`・ロックの使用箇所はまだ無い。API サーバー (Phase 3) で書き込み経路が増える前に対応する

### 段階的な旧コード除去

- 旧 Express 層 (EJS テンプレート、旧コントローラ) は **Phase 5 まで残す**
- API サーバーで全機能をカバーした後に除去
- 削除前に旧エンドポイントの利用状況を確認

### Logger の設計 (Phase 1-3 で対応) ✅ 対応済み

リポジトリ層の再利用性評価で「Logger 依存を除けばほぼそのまま」とあるように、Logger の扱いは早期に決める必要がある。

- shared パッケージに Logger インターフェース (抽象) を定義
- 各パッケージ (bot, api) で具体的な Logger 実装を注入 (DI)
- Phase 5 の「構造化ログの統一」と整合性を持たせる
- **状況**: shared に `LoggerPort` (`types/log.ts`) と `getLogger` / `setLogger` を定義し、bot / speak が起動時に実装を注入している

### 環境変数の管理方針

Bot・API・Front で異なる環境変数が必要になるため、以下の方針で整理する:

- 各パッケージに `.env.example` を配置し、必要な環境変数を明示
- shared パッケージに共通の環境変数 (DB 接続情報等) を定義
- パッケージ固有の環境変数 (Discord トークン、JWT シークレット等) は各パッケージで管理
- **状況: 未着手** — `.env.example` はまだどのパッケージにも無い。現状 bot / speak の設定は `config.ts` (テンプレートからコピー) で管理し、環境変数を読むのはマイグレーション CLI (`DB_*`) とインテグレーションテスト (`TEST_DB_*`) のみ

### エラー型の共通化 (Phase 2 で対応予定 — 未着手)

サービス層が投げるエラーの型を早期に統一する:

- shared パッケージにドメインエラー型 (例: `NotFoundError`, `ValidationError`, `ConflictError`) を定義
- サービス層はこれらの共通エラーを throw し、各パッケージ (bot の Embed 変換、API の HTTP ステータスマッピング) で適切に変換
- Phase 3 の API エラーレスポンス (`{ error: { code, message, details } }`) への変換が容易になる
- **状況**: shared にドメインエラー型はまだ定義されていない。Phase 3 着手前に用意する

### 未使用依存の整理

Phase 1-1 で以下を削除済み:

| パッケージ | 対応 |
|---|---|
| `@sequelize/core` | 削除 (TypeORM を使用しており未使用) |
| `fs` (0.0.1-security) | 削除 (Node.js ネイティブで代替) |
| `kysely` | 削除 (未使用の代替クエリビルダ) |
| `sqlite3`, `pg`, `pg-hstore` | 削除 (MariaDB を使用しており不要) |

その後も未使用依存 (`passport*`, `mariadb`, 一部の `@types/*` 等) が残っている。現状の一覧は `docs/issues.md` を参照。

---

## 7. 各フェーズの成果判定基準

| Phase | 完了条件 |
|---|---|
| 1-1 | pnpm でビルド・起動ができ、未使用依存が削除されている |
| 1-2 | モノレポ構成で `packages/bot` のビルド・起動ができ、smoke test が通る |
| 1-3 | shared パッケージにモデル・リポジトリが移動し、Bot が `@orangebot/shared` 経由で動作する (smoke test で検証) |
| 1-4 | クリーン状態からワンコマンドでビルド・起動でき、マイグレーション運用の手順が整備されている |
| 2-1 | Vitest が動作し、`synchronize: false` に切り替え済みで、純粋ロジック (dice, photo) のユニットテストが通る |
| 2-2 | DB 依存サービス (user, gacha) が DTO ベースの I/F で動作し、ユニットテスト + リポジトリ層のインテグレーションテストが通る |
| 2-3 | 全サービスの切り出しが完了し、Bot が adapters 経由で動作する (全テスト通過) |
| 2 (付帯) | 排他制御が必要な書き込み操作がトランザクション化され、ドメインエラー型が shared に定義されている |
| 3 | Fastify API の全エンドポイントが認証付きで動作し、テストが通る |
| 4 | Vue + Vuetify フロントエンドから API 経由で主要機能が操作できる |
| 5 | Docker Compose で全サービスが起動し、CI が通る |
