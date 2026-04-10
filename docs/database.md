# データベース設計

## 概要

- **DBMS:** MariaDB
- **ORM:** TypeORM v0.3
- **スキーマ同期:** `synchronize: true` (自動マイグレーション)

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

### その他のエンティティ

- **Color** - カラーデータ
- **Role** - ユーザーロール
- **Speaker** - TTS スピーカー設定
- **UserSetting** - ユーザー個別設定
- **Timer** - タイマーデータ
- **MusicInfo** - 楽曲メタデータ
- **BotInfo** - Bot 情報
