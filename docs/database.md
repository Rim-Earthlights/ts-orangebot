# データベース設計

## 概要

- **DBMS:** MariaDB
- **ORM:** TypeORM v0.3
- **スキーマ同期:** 全パッケージで `synchronize: false` (Phase 2-1 で切り替え済み)。スキーマ変更はマイグレーションで管理する
- **エンティティ数:** 17 (`packages/shared/src/models/`)。DataSource に登録するのは `packages/shared/src/config/entities.ts` の `SHARED_ENTITIES` (Timer を除く 16)
- **DataSource ファクトリ:** `packages/shared/src/config/datasource.ts` の `createDataSource(config)` を bot / speak から呼び出して初期化
- **マイグレーション CLI:** `pnpm --filter @orangebot/shared migration:{generate,run,revert,show}` (エントリは `packages/shared/scripts/data-source-cli.ts`)
  - 接続先は `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` で指定する。`dotenv/config` はカレントディレクトリの `.env` を読むため、`--filter` 実行時は **`packages/shared/.env`** に置く
  - `migration:generate` は生成先パスが必須: `pnpm --filter @orangebot/shared migration:generate src/migrations/<Name>`。生成後は `src/migrations/index.ts` の `MIGRATIONS` に追記する
  - 任意の TypeORM CLI サブコマンドは `pnpm --filter @orangebot/shared typeorm <subcommand>` で実行できる (`-d scripts/data-source-cli.ts` 付き)
- **マイグレーション定義:** `packages/shared/src/migrations/` に配置し、`src/migrations/index.ts` の `MIGRATIONS` 配列に適用順で登録する

### マイグレーション運用

- 新規 DB は `migration:run` で全スキーマが構築される (初期マイグレーション `InitialSchema` を含む)
- **`synchronize: true` 時代に構築された既存 DB へのベースライン:** 既にテーブルが存在するため、`InitialSchema` を実行せずに適用済みとして記録する必要がある。以下を一度だけ手動実行する:
  ```sql
  CREATE TABLE IF NOT EXISTS `migrations` (
    `id` int NOT NULL AUTO_INCREMENT,
    `timestamp` bigint NOT NULL,
    `name` varchar(255) NOT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  -- InitialSchema のクラス名 (タイムスタンプ付き) を登録する
  INSERT INTO `migrations` (`timestamp`, `name`) VALUES (1781178467139, 'InitialSchema1781178467139');
  ```
- マイグレーションの正しさは `packages/shared/test/integration/migration.test.ts` で検証する (空 DB に全適用 → エンティティ定義との差分ゼロを確認)

### テスト用 DB

- ルートの `docker-compose.test.yml` で使い捨て MariaDB (ポート 3307) を起動する
- `pnpm test:db:up` → `pnpm test:integration` → `pnpm test:db:down` の順に実行する
- 接続先は `TEST_DB_HOST` / `TEST_DB_PORT` / `TEST_DB_USERNAME` / `TEST_DB_PASSWORD` / `TEST_DB_DATABASE` で上書き可能 (既定はコンテナの値)

> Discord ID 系の列 (`id`, `guild_id`, `channel_id`, `user_id`, `bot_id` 等) は DB 上は `bigint(20)` として定義されているが、TypeORM の慣習によりアプリケーション層では `string` として扱われる。以下の表の「型」は DB 上の型を示す。
>
> 真偽値の列は DB 上 `tinyint` で、アプリケーション層では多くが `number` (0/1) として扱われる (Room のみ `boolean`)。enum 相当の列は `varchar` で、**小文字の値**が保存される。
>
> タイムスタンプ列 (`created_at` / `updated_at` / `deleted_at`) はエンティティごとに異なるため、各表の下に記載する。`deleted_at` を持つエンティティは `@DeleteDateColumn` による論理削除 (ソフトデリート) に対応している。

## 外部キー

`InitialSchema` で以下の外部キー制約が作成される (いずれも `ON DELETE NO ACTION`)。参照先の行が存在しないと INSERT が失敗するため、**`guild` / `user_setting` → `users` → `gacha`**、**`item_rank` → `item` → `gacha`**、**`bot_info` → `chat_history`** の順で作成する必要がある。

| 参照元 | 参照先 |
|---|---|
| `users.guild_id` | `guild.id` |
| `users.id` | `user_setting.user_id` |
| `gacha.user_id` | `users.id` |
| `gacha.item_id` | `item.id` |
| `item.rare` | `item_rank.rare` |
| `role.guild_id` | `guild.id` |
| `chat_history.bot_id` | `bot_info.bot_id` |

## エンティティ一覧

### Users - ユーザー

| カラム | 型 | 説明 |
|---|---|---|
| `id` | bigint (PK, FK) | Discord ユーザー ID (`user_setting.user_id` への外部キー) |
| `guild_id` | bigint (PK, FK) | ギルド ID (複合主キー。`guild.id` への外部キー) |
| `user_name` | varchar (nullable) | ユーザー名 |
| `type` | varchar | 権限タイプ (`member` / `admin` / `owner` / `bot`。既定 `member`) |
| `pick_left` | int | 残りガチャチケット数 (既定 0) |
| `last_pick_date` | datetime (nullable) | 最終ガチャ実行日時 |
| `voice_channel_data` | json (nullable) | ボイスチャンネルデータ |

タイムスタンプ: `created_at` / `updated_at` / `deleted_at`

### Gacha - ガチャ記録

| カラム | 型 | 説明 |
|---|---|---|
| `id` | int (PK, auto) | ID |
| `user_id` | bigint (FK) | ユーザー ID (`users.id`) |
| `item_id` | bigint (FK) | アイテム ID (`item.id`) |
| `pick_date` | datetime | ガチャ実行日時 |
| `is_used` | tinyint | 使用済みフラグ (既定 0) |

タイムスタンプ: `created_at` / `deleted_at`

### Item - ガチャアイテム

| カラム | 型 | 説明 |
|---|---|---|
| `id` | bigint (PK, auto) | ID |
| `name` | varchar | アイテム名 |
| `rare` | varchar (FK) | レアリティ (`item_rank.rare` への外部キー) |
| `icon` | varchar (nullable) | アイコン |
| `description` | varchar (nullable) | 説明 |
| `weight` | smallint | ドロップ率の重み (既定 1) |
| `price` | int | 価格 (既定 0) |
| `is_present` | tinyint | プレゼントフラグ (既定 0) |
| `reroll` | smallint | リロール回数 (既定 0) |

タイムスタンプ: `created_at` / `deleted_at`

### ItemRank - レアリティランク

| カラム | 型 | 説明 |
|---|---|---|
| `id` | bigint (PK, auto) | ID |
| `rare` | varchar (unique) | レアリティ (`UUR` / `UR` / `SSR` / `SR` / `R` / `UC` / `C` / `P`) |
| `rank` | smallint | ランク (並び順) |

タイムスタンプ: `created_at` / `deleted_at`

### Room - ボイスルーム

| カラム | 型 | 説明 |
|---|---|---|
| `room_id` | bigint (PK) | ルーム (ボイスチャンネル) ID |
| `guild_id` | bigint | ギルド ID |
| `name` | varchar | ルーム名 |
| `is_autodelete` | tinyint(1) | 自動削除 (既定 1) |
| `is_live` | tinyint(1) | 配信モード (既定 0) |
| `is_private` | tinyint(1) | プライベート (既定 0) |

タイムスタンプ: `created_at` / `updated_at` / `deleted_at`

### Guild - ギルド設定

| カラム | 型 | 説明 |
|---|---|---|
| `id` | bigint (PK) | ギルド ID |
| `name` | varchar | ギルド名 |
| `lobby_name` | varchar | ロビーチャンネル名 (既定 `ロビー`) |
| `inactive_name` | varchar | 非アクティブチャンネル名 (既定 `墓`) |
| `exclude_names` | varchar (nullable) | 除外チャンネル名 |
| `silent` | tinyint | 通知サイレントフラグ (既定 0) |

タイムスタンプ: `created_at` / `updated_at` / `deleted_at`

### Music - 音楽キュー

| カラム | 型 | 説明 |
|---|---|---|
| `guild_id` | bigint (PK) | ギルド ID |
| `channel_id` | bigint (PK) | チャンネル ID |
| `music_id` | smallint (PK) | 楽曲 ID (複合主キー) |
| `title` | varchar | タイトル |
| `url` | varchar | URL |
| `thumbnail` | varchar | サムネイル |
| `is_play` | tinyint | 再生中フラグ (既定 0) |

タイムスタンプ: `created_at` のみ

### MusicInfo - 再生状態

| カラム | 型 | 説明 |
|---|---|---|
| `guild_id` | bigint (PK) | ギルド ID |
| `channel_id` | bigint (PK) | チャンネル ID (複合主キー) |
| `is_shuffle` | tinyint | シャッフルフラグ (既定 0) |
| `is_loop` | tinyint | ループフラグ (既定 0) |
| `title` | varchar (nullable) | 再生中のタイトル |
| `url` | varchar (nullable) | 再生中の URL |
| `thumbnail` | varchar (nullable) | 再生中のサムネイル |
| `silent` | tinyint | 通知サイレントフラグ (既定 0) |

タイムスタンプ: `created_at` のみ

### Playlist - プレイリスト

| カラム | 型 | 説明 |
|---|---|---|
| `id` | bigint (PK, auto) | ID (アプリケーション層では `string`) |
| `user_id` | bigint | ユーザー ID |
| `name` | varchar | プレイリスト名 |
| `title` | varchar | タイトル |
| `url` | varchar | URL |
| `shuffle` | tinyint | シャッフルフラグ (既定 1) |
| `loop` | tinyint | ループフラグ (既定 1) |

タイムスタンプ: `created_at` のみ

### ChatHistory - チャット履歴

| カラム | 型 | 説明 |
|---|---|---|
| `uuid` | varchar (PK) | UUID |
| `channel_id` | bigint | チャンネル ID |
| `bot_id` | bigint (FK) | Bot ID (`bot_info.bot_id` への外部キー) |
| `channel_type` | varchar | チャンネル種別 (`dm` / `guild`) |
| `content` | json | メッセージ配列 |
| `model` | varchar | 使用モデル |
| `mode` | varchar | チャットモード |
| `name` | varchar (nullable) | 会話相手の名前 (DM はユーザーの表示名、ギルドはサーバー名) |

タイムスタンプ: `created_at` / `updated_at` / `deleted_at`

### BotInfo - Bot 情報

| カラム | 型 | 説明 |
|---|---|---|
| `bot_id` | bigint (PK) | Bot のユーザー ID |
| `name` | varchar | Bot 名 |
| `font_color` | varchar | 文字色 (既定 `#ffffff`) |
| `background_color` | varchar | 背景色 (既定 `#000000`) |

タイムスタンプ: `created_at` / `updated_at` / `deleted_at`

### Log - ログ

| カラム | 型 | 説明 |
|---|---|---|
| `id` | bigint (PK, auto) | ID |
| `bot_id` | bigint | Bot ID (既定値あり) |
| `guild_id` | bigint (nullable) | ギルド ID |
| `channel_id` | bigint (nullable) | チャンネル ID |
| `user_id` | bigint (nullable) | ユーザー ID |
| `level` | varchar | ログレベル (`system` / `info` / `error` / `debug`) |
| `event` | varchar | イベント名 |
| `message` | text (nullable) | メッセージ |

タイムスタンプ: `created_at` / `updated_at` / `deleted_at`

### Speaker - 読み上げ Bot の使用状況

読み上げ Bot (`packages/speak`) インスタンスの貸出状況を guild × bot ユーザー単位で管理する。bot の `.speak` / `/speak` が未使用インスタンスの検索に、speak の `/speaker/call` / `/speaker/discon` が使用状況の更新に使う。

| カラム | 型 | 説明 |
|---|---|---|
| `guild_id` | bigint (PK) | ギルド ID |
| `user_id` | bigint (PK) | 読み上げ Bot のユーザー ID (複合主キー) |
| `is_used` | tinyint(1) | 使用中フラグ (既定 0) |

タイムスタンプ: なし

### UserSetting - ユーザー個別設定

| カラム | 型 | 説明 |
|---|---|---|
| `user_id` | bigint (PK) | Discord ユーザー ID (`users.id` から参照される) |
| `nickname` | varchar (nullable) | ニックネーム |
| `pref` | varchar (nullable) | 居住地 (`.reg pref` で登録) |
| `birth_date` | datetime (nullable) | 誕生日 |
| `model_type` | varchar | AI チャットのモデル種別 (`default` / `low` / `high`。既定 `default`) |
| `voice_id` | int | 読み上げの声 ID (既定 3) |
| `voice_speed` | float | 読み上げスピード (既定 1.0) |
| `voice_pitch` | float | 読み上げピッチ (既定 0.0) |
| `voice_intonation` | float | 読み上げ抑揚 (既定 1.0) |

タイムスタンプ: `created_at` / `updated_at` / `deleted_at`

### Role - ロール

| カラム | 型 | 説明 |
|---|---|---|
| `id` | bigint (PK, auto) | ID |
| `guild_id` | bigint (FK) | ギルド ID (`guild.id` への外部キー) |
| `role_id` | bigint | Discord ロール ID |
| `type` | varchar | ロール種別 (`game` / `user` / `bot` / `admin`) |
| `name` | varchar | ロール名 |

タイムスタンプ: `created_at` / `updated_at` / `deleted_at`

### Color - カラーデータ

| カラム | 型 | 説明 |
|---|---|---|
| `id` | int (PK, auto) | ID |
| `role_id` | bigint | Discord ロール ID |
| `color_code` | varchar | カラーコード |
| `color_name` | varchar | カラー名 |

タイムスタンプ: `created_at` / `updated_at` / `deleted_at`

### Timer - タイマーデータ (未使用)

> `models/timer.ts` にエンティティ定義は残っているが、`SHARED_ENTITIES` に登録されておらず、`InitialSchema` でも `timer` テーブルは作成されない。現行の DB には存在しない。

| カラム | 型 | 説明 |
|---|---|---|
| `id` | int (PK, auto) | ID |
| `guild_id` | bigint | ギルド ID |
| `user_id` | bigint | ユーザー ID |
| `channel_id` | bigint | チャンネル ID |
| `timer_date` | datetime | 通知日時 |
| `description` | varchar(30) (nullable) | 説明 |

タイムスタンプ: `created_at` / `updated_at`
