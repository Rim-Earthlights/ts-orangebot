# 次フェーズ移行提案: モノレポ化 + API サーバー / フロントエンド新設

## 1. 背景と目的

### 現状

OrangeBot-TS は Discord Bot 単体として動作しており、Express サーバーと Discord クライアントが **単一プロセス** で稼働している。Web UI は EJS テンプレートによる簡易的なもので、外部から利用可能な JSON API は存在しない。

### 課題 (詳細は `docs/issues.md` を参照)

- HTTP エンドポイントに認証がない
- ビジネスロジックが Discord.js と密結合しており、Web からの再利用が困難
- サービス層が未整備 (3ファイル中1ファイルは空)
- テストがゼロ
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
| TypeORM モデル (14エンティティ) | **95%** | そのまま shared に移動 |
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
│   │   │   ├── handlers/          ← コマンドハンドラ
│   │   │   ├── managers/          ← メッセージ/インタラクション管理
│   │   │   └── adapters/          ← shared サービスと Discord の橋渡し
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
└── docker-compose.yml              ← 開発環境 (★ 新規)
```

### 技術選定

| 項目 | 現状 | 移行後 |
|---|---|---|
| パッケージマネージャ | Yarn Classic (v1) | **pnpm** (ワークスペース対応、厳密な依存解決) |
| モジュール | ESNext (ESM) | ESNext (ESM) ← 変更なし |
| TypeScript | 5.8 | 5.8 ← 変更なし |
| DB | MariaDB + TypeORM | MariaDB + TypeORM ← 変更なし |
| API フレームワーク | Express 5 (EJS) | **Fastify** (プラグインによる関心の分離が容易・高パフォーマンス) |
| 認証 | passport (未活用) | **JWT (@fastify/jwt)** |
| バリデーション | なし | **zod** (`fastify-type-provider-zod` で Fastify と統合。shared の DTO バリデーションにも統一的に使用) |
| フロントエンド | EJS テンプレート | **Vue 3 + Vuetify 3** (Vite / Composition API + Material Design コンポーネントにより管理画面を高速に構築) |
| テスト | なし | **Vitest** |
| コンテナ | なし | **Docker Compose** (開発環境) |

---

## 4. 移行フェーズ

### Phase 1: モノレポ基盤構築

Phase 1 は対応範囲が広いため、以下の 4 つのサブフェーズに分割する。
各サブフェーズ完了時に Bot の動作確認を行い、問題があれば次に進まない。

---

#### Phase 1-1: パッケージマネージャ移行

**目的**: Yarn から pnpm に移行し、ワークスペースの基盤を作る

**作業内容**:

1. pnpm のインストール・設定
2. `yarn.lock` → `pnpm-lock.yaml` への移行
3. ルート `package.json` の scripts を pnpm 向けに調整
4. 未使用依存パッケージの削除
   - `@sequelize/core` (TypeORM を使用しており未使用)
   - `fs` (0.0.1-security) (Node.js ネイティブで代替)
   - `kysely` (未使用の代替クエリビルダ)
   - `sqlite3`, `pg`, `pg-hstore` (MariaDB を使用しており不要)
5. 動作確認: `pnpm install` → `pnpm build` → Bot 起動

**成果物**:
- pnpm でビルド・起動ができる状態
- 未使用依存の削除

**リスク**:
- phantom dependency (Yarn で暗黙的に解決されていた依存) の顕在化 → `pnpm install` 時にエラーで検出できるため、都度対応
- pnpm の厳密な依存解決により TypeORM やネイティブモジュールが動作しない場合がある → `.npmrc` に `shamefully-hoist=true` を設定して解消し、段階的に strict モードへ移行する

---

#### Phase 1-2: モノレポ構成・ワークスペース設定

**目的**: pnpm ワークスペースを有効にし、パッケージの骨格を作る

**作業内容**:

1. `pnpm-workspace.yaml` 作成
   ```yaml
   packages:
     - 'packages/*'
   ```
2. `tsconfig.base.json` 作成 (共通コンパイラオプション)
3. `packages/bot/` ディレクトリ作成
   - `package.json`, `tsconfig.json` を作成
4. `packages/shared/` ディレクトリ作成
   - `package.json`, `tsconfig.json` を作成
5. 既存の `src/` を `packages/bot/src/` に移動
   - ルートの `tsconfig.json` を `packages/bot/tsconfig.json` として調整
   - ビルドスクリプトの動作確認
6. smoke test スクリプトの作成
   - Bot の起動 → DB 接続 → Discord Gateway 接続 → コマンドハンドラ登録 → 正常シャットダウンを確認するスクリプト
   - DB 接続だけでなく、import パス変更によるハンドラ登録漏れも検出できるようにする
   - 以降の全フェーズでデグレ検出に使用する

**成果物**:
- モノレポのディレクトリ構造が確立
- `packages/bot` で既存と同じビルド・起動ができる
- smoke test スクリプトが動作する

**リスク**:
- パス解決の変更によるビルドエラー → tsconfig の `paths` / `rootDir` を慎重に調整

---

#### Phase 1-3: shared パッケージへのモデル・リポジトリ切り出し

**目的**: TypeORM エンティティとリポジトリ層を shared パッケージに移動する

**作業内容**:

1. DB 設定の移動 (最初に移動することで、後続の移動時に循環参照を防ぐ)
   - `src/model/typeorm/` → `packages/shared/src/config/`
   - TypeORM DataSource を shared から export
2. モデル層の移動
   - `src/model/models/` → `packages/shared/src/models/`
3. リポジトリ層の移動
   - `src/model/repository/` → `packages/shared/src/repository/`
4. 共有型定義の整理
   - `packages/shared/src/types/` に DTO・共通型を配置
5. `packages/bot` から `@shared/*` への import パス変更
   - TypeScript path aliases の設定
6. 動作確認: Bot が shared 経由で DB アクセスできること

**成果物**:
- shared パッケージにモデル・リポジトリ・DB 設定が集約
- Bot は `@shared/*` 経由でこれらを利用

**リスク**:
- import パス変更による不整合 → DB 設定 → エンティティ → リポジトリの順に 1 ファイルずつ移動し、移動のたびに smoke test を実行して検証する
- TypeORM DataSource の初期化順序 → shared 側で DataSource インスタンスを export し、各パッケージの起動時に `initialize()` を呼び出す形に統一する

---

#### Phase 1-4: ビルド・開発環境の整備

**目的**: モノレポとしての開発体験を整える

**作業内容**:

1. ルート `package.json` に共通スクリプトを定義
   - `pnpm -r build`, `pnpm -r dev`, `pnpm -r lint` 等
2. shared → bot のビルド順序を設定
   - shared のビルドが先に走るよう `workspace:` プロトコルで依存定義
3. マイグレーション運用の準備
   - TypeORM マイグレーション生成・実行の手順を整備
   - `synchronize: false` への切り替えは Phase 2-1 (Vitest 導入後) に行う。テスト基盤がない状態での切り替えはマイグレーションの正しさを検証できないため
4. `.gitignore`, `.npmrc` 等のルート設定ファイル調整
5. 最終動作確認: クリーンな状態から `pnpm install` → `pnpm build` → Bot 起動

**成果物**:
- モノレポ構成で一貫したビルド・開発フローが確立
- マイグレーション運用の手順が整備されている (`synchronize: false` 切り替えは Phase 2-1 で実施)

**リスク**:
- ビルド順序の循環依存 → shared は他パッケージに依存しない設計を徹底

---

### Phase 2: サービス層の整備

**目的**: ビジネスロジックを Discord 非依存のサービスとして切り出す

Phase 2 は対応範囲が広いため、以下の 3 つのサブフェーズに分割する。
各サブフェーズ完了時に smoke test + ユニットテストを実行し、問題があれば次に進まない。

**切り出し対象の判断基準**:

| 関数の性質 | 判断 |
|---|---|
| 純粋な計算・抽選ロジック | → shared/services に移動 |
| DB 操作 (CRUD) | → shared/repository のまま |
| Discord メッセージ送信・フォーマット | → bot/adapters に残す |
| Discord イベント処理 | → bot/handlers に残す |

---

#### Phase 2-1: テスト基盤 + 純粋ロジックの移動

**目的**: Vitest を導入し、Discord 非依存の純粋ロジックから着手する

**作業内容**:

1. テスト基盤構築
   - Vitest 導入・設定
   - shared / bot 両パッケージのテスト実行環境を整備
   - テスト用 DB コンテナ (Docker) のセットアップ (インテグレーションテスト用)
2. `synchronize: false` への切り替え
   - Phase 1-4 で準備したマイグレーション手順に基づき切り替え
   - マイグレーションの正しさをテストで検証
3. 純粋ロジックの移動
   - `dice.service.ts` - ダイスロジック (既存をそのまま移動)
   - `photo.service.ts` - 写真サービス (既存をそのまま移動)
4. 移動したサービスのユニットテスト作成
5. Bot 側で import パスを変更し、smoke test で動作確認

**成果物**:
- Vitest によるテスト実行環境 + テスト用 DB コンテナ
- `synchronize: false` への切り替え完了
- 純粋ロジックのサービス化 + ユニットテスト

---

#### Phase 2-2: DB 依存サービスの切り出し

**目的**: DB アクセスを伴うビジネスロジックをサービスとして切り出す

**作業内容**:

1. サービスクラスの新規作成
   - `user.service.ts` - ユーザー管理ロジック
   - `gacha.service.ts` - ガチャ抽選ロジック (dot_function/gacha.ts から抽出)
2. DTO (Data Transfer Object) の定義
   - サービスの入出力を型安全な DTO で定義
   - Discord の Message / Interaction に依存しない I/F
3. テスト作成
   - ユニットテスト (リポジトリ層をモックしてサービスロジックを検証)
   - インテグレーションテスト (テスト用 DB に対してリポジトリ層自体の動作を検証)
4. smoke test で動作確認

**成果物**:
- DB 依存サービスの切り出し + DTO 定義
- ユニットテスト + リポジトリ層のインテグレーションテスト

---

#### Phase 2-3: Discord 密結合ロジックの抽出 + アダプター層

**目的**: Discord.js に密結合したロジックからビジネスロジックを抽出し、アダプター層を整備する

**作業内容**:

1. ロジック抽出・サービス化
   - `chat.service.ts` - チャット管理ロジック
   - `room.service.ts` - ルーム管理ロジック
   - `music.service.ts` - 音楽キュー管理ロジック
2. Bot 側にアダプター層を作成
   - `packages/bot/src/adapters/` で Discord.js ↔ サービス層を橋渡し
   - ハンドラからサービスを呼び出し、結果を EmbedBuilder 等で整形
3. ユニットテスト作成
4. smoke test + 手動での Bot 動作確認

**成果物**:
- Discord 非依存のサービス層 (全サービス完了)
- Bot のアダプター層
- サービス層のユニットテスト一式

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

### 段階的な旧コード除去

- 旧 Express 層 (EJS テンプレート、旧コントローラ) は **Phase 5 まで残す**
- API サーバーで全機能をカバーした後に除去
- 削除前に旧エンドポイントの利用状況を確認

### Logger の設計 (Phase 1-3 で対応)

リポジトリ層の再利用性評価で「Logger 依存を除けばほぼそのまま」とあるように、Logger の扱いは早期に決める必要がある。

- shared パッケージに Logger インターフェース (抽象) を定義
- 各パッケージ (bot, api) で具体的な Logger 実装を注入 (DI)
- Phase 5 の「構造化ログの統一」と整合性を持たせる

### 環境変数の管理方針

Bot・API・Front で異なる環境変数が必要になるため、以下の方針で整理する:

- 各パッケージに `.env.example` を配置し、必要な環境変数を明示
- shared パッケージに共通の環境変数 (DB 接続情報等) を定義
- パッケージ固有の環境変数 (Discord トークン、JWT シークレット等) は各パッケージで管理

### エラー型の共通化 (Phase 2 で対応)

サービス層が投げるエラーの型を早期に統一する:

- shared パッケージにドメインエラー型 (例: `NotFoundError`, `ValidationError`, `ConflictError`) を定義
- サービス層はこれらの共通エラーを throw し、各パッケージ (bot の Embed 変換、API の HTTP ステータスマッピング) で適切に変換
- Phase 3 の API エラーレスポンス (`{ error: { code, message, details } }`) への変換が容易になる

### 未使用依存の整理

Phase 1-1 で以下を整理 (詳細は Phase 1-1 の作業内容を参照):

| パッケージ | 対応 |
|---|---|
| `@sequelize/core` | 削除 (TypeORM を使用しており未使用) |
| `fs` (0.0.1-security) | 削除 (Node.js ネイティブで代替) |
| `kysely` | 削除 (未使用の代替クエリビルダ) |
| `sqlite3`, `pg`, `pg-hstore` | 削除 (MariaDB を使用しており不要) |

---

## 7. 各フェーズの成果判定基準

| Phase | 完了条件 |
|---|---|
| 1-1 | pnpm でビルド・起動ができ、未使用依存が削除されている |
| 1-2 | モノレポ構成で `packages/bot` のビルド・起動ができ、smoke test が通る |
| 1-3 | shared パッケージにモデル・リポジトリが移動し、Bot が `@shared/*` 経由で動作する (smoke test で検証) |
| 1-4 | クリーン状態からワンコマンドでビルド・起動でき、マイグレーション運用の手順が整備されている |
| 2-1 | Vitest が動作し、`synchronize: false` に切り替え済みで、純粋ロジック (dice, photo) のユニットテストが通る |
| 2-2 | DB 依存サービス (user, gacha) が DTO ベースの I/F で動作し、ユニットテスト + リポジトリ層のインテグレーションテストが通る |
| 2-3 | 全サービスの切り出しが完了し、Bot が adapters 経由で動作する (全テスト通過) |
| 3 | Fastify API の全エンドポイントが認証付きで動作し、テストが通る |
| 4 | Vue + Vuetify フロントエンドから API 経由で主要機能が操作できる |
| 5 | Docker Compose で全サービスが起動し、CI が通る |
