# データベース設計

## 概要

- **DBMS:** MariaDB
- **ORM:** TypeORM v0.3
- **スキーマ同期:** 全パッケージで `synchronize: false` (Phase 2-1 で切り替え済み)。スキーマ変更はマイグレーションで管理する
- **エンティティ数:** 17 (`packages/shared/src/models/`)。DataSource に登録するのは `packages/shared/src/config/entities.ts` の `SHARED_ENTITIES` (Timer を除く 16)
- **DataSource ファクトリ:** `packages/shared/src/config/datasource.ts` の `createDataSource(config)` を bot / speak から呼び出して初期化
- **マイグレーション CLI:** `pnpm --filter @orangebot/shared migration:{generate,run,revert,show}` (DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE を `.env` で指定)
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

> Discord ID 系の主キー (`id`, `guild_id`, `channel_id` 等) は DB 上は `bigint(20)` として定義されているが、TypeORM の慣習によりアプリケーション層では `string` として扱われる。

## エンティティ一覧

### Users - ユーザー

| カラム | 型 | 説明 |
|---|---|---|
| `id` | string (PK) | Discord ユーザー ID |
| `guild_id` | string (PK) | ギルド ID (複合主キー) |
| `user_name` | string | ユーザー名 |
| `type` | enum | 権限タイプ (MEMBER/ADMIN/OWNER/BOT) |
| `pick_left` | number | 残りガチャチケット数 |
| `last_pick_date` | date | 最終ガチャ実行日 |
| `voice_channel_data` | JSON | ボイスチャンネルデータ |
| `created_at` | datetime | 作成日時 |
| `updated_at` | datetime | 更新日時 |

### Gacha - ガチャ記録

| カラム | 型 | 説明 |
|---|---|---|
| `id` | number (PK, auto) | ID |
| `user_id` | string (FK) | ユーザー ID |
| `item_id` | number (FK) | アイテム ID |
| `pick_date` | date | ガチャ実行日 |
| `is_used` | boolean | 使用済みフラグ |

### Item - ガチャアイテム

| カラム | 型 | 説明 |
|---|---|---|
| `id` | number (PK, auto) | ID |
| `name` | string | アイテム名 |
| `rare` | number | レアリティ |
| `icon` | string | アイコン |
| `description` | string | 説明 |
| `weight` | number | ドロップ率の重み |
| `price` | number | 価格 |
| `is_present` | boolean | プレゼントフラグ |

### ItemRank - レアリティランク

レアリティの段階とその属性を定義。

### Room - ボイスルーム

| カラム | 型 | 説明 |
|---|---|---|
| `room_id` | string (PK) | ルーム ID |
| `guild_id` | string | ギルド ID |
| `name` | string | ルーム名 |
| `is_autodelete` | boolean | 自動削除 |
| `is_live` | boolean | 配信モード |
| `is_private` | boolean | プライベート |
| `created_at` | datetime | 作成日時 |
| `updated_at` | datetime | 更新日時 |

### Guild - ギルド設定

| カラム | 型 | 説明 |
|---|---|---|
| `id` | string (PK) | ギルド ID |
| `name` | string | ギルド名 |
| `lobby_name` | string | ロビーチャンネル名 |
| `inactive_name` | string | 非アクティブチャンネル名 |
| `exclude_names` | string | 除外チャンネル名 |
| `silent` | boolean | 通知サイレントフラグ |

### Music - 音楽キュー

| カラム | 型 | 説明 |
|---|---|---|
| `guild_id` | string (PK) | ギルド ID |
| `channel_id` | string (PK) | チャンネル ID |
| `music_id` | number (PK) | 楽曲 ID (複合主キー) |
| `title` | string | タイトル |
| `url` | string | URL |
| `thumbnail` | string | サムネイル |
| `is_play` | boolean | 再生中フラグ |

### Playlist - プレイリスト

| カラム | 型 | 説明 |
|---|---|---|
| `id` | number (PK, auto) | ID |
| `user_id` | string | ユーザー ID |
| `name` | string | プレイリスト名 |
| `title` | string | タイトル |
| `url` | string | URL |
| `shuffle` | boolean | シャッフルフラグ |
| `loop` | boolean | ループフラグ |

### ChatHistory - チャット履歴

| カラム | 型 | 説明 |
|---|---|---|
| `uuid` | string (PK) | UUID |
| `channel_id` | string | チャンネル ID |
| `bot_id` | string | Bot ID |
| `channel_type` | enum | チャンネル種別 (DM/GUILD) |
| `content` | JSON | メッセージ配列 |
| `model` | string | 使用モデル |
| `mode` | string | チャットモード |

### Log - ログ

| カラム | 型 | 説明 |
|---|---|---|
| `id` | number (PK, auto) | ID |
| `bot_id` | string | Bot ID |
| `guild_id` | string | ギルド ID |
| `channel_id` | string | チャンネル ID |
| `user_id` | string | ユーザー ID |
| `level` | enum | ログレベル (SYSTEM/INFO/WARN/ERROR) |
| `event` | string | イベント名 |
| `message` | string | メッセージ |

### Speaker - 読み上げ Bot の使用状況

読み上げ Bot (`packages/speak`) インスタンスの貸出状況を guild × bot ユーザー単位で管理する。bot の `.speak` / `/speak` が未使用インスタンスの検索に、speak の `/speaker/call` / `/speaker/discon` が使用状況の更新に使う。

| カラム | 型 | 説明 |
|---|---|---|
| `guild_id` | string (PK) | ギルド ID |
| `user_id` | string (PK) | 読み上げ Bot のユーザー ID (複合主キー) |
| `is_used` | tinyint | 使用中フラグ |

### その他のエンティティ

- **Color** - カラーデータ
- **Role** - ユーザーロール
- **UserSetting** - ユーザー個別設定 (読み上げの声 ID・スピード・ピッチ・抑揚を含む)
- **Timer** - タイマーデータ
- **MusicInfo** - 楽曲メタデータ
- **BotInfo** - Bot 情報
