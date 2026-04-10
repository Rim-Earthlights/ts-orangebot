# アーキテクチャ

## ディレクトリ構成

```
src/
├── app.ts                    # エントリーポイント (Express + Discord Bot)
├── auth.ts                   # 認証モジュール
├── routers.ts                # Express ルーター集約
│
├── bot/                      # Bot コアロジック
│   ├── dot_function/         # ドットコマンド (`.xxx`) のビジネスロジック
│   │   ├── chat.ts           # AI チャット
│   │   ├── dice.ts           # ダイス / ゲーム
│   │   ├── forecast.ts       # 天気予報
│   │   ├── gacha.ts          # ガチャ
│   │   ├── music.ts          # 音楽再生
│   │   ├── room.ts           # ルーム管理
│   │   ├── register.ts       # ユーザー登録
│   │   ├── speak.ts          # 読み上げ (TTS)
│   │   ├── voice.ts          # ボイスチャンネルイベント
│   │   ├── mention.ts        # メンション処理
│   │   └── debug.ts          # デバッグ
│   │
│   ├── manager/              # コマンドルーティング
│   │   ├── message.manager.ts      # ドットコマンドのルーター
│   │   ├── interaction.manager.ts  # スラッシュコマンドのルーター
│   │   ├── message.handler.ts      # メッセージハンドラ I/F
│   │   ├── interaction.handler.ts  # インタラクションハンドラ I/F
│   │   └── handlers/
│   │       ├── commands/           # ドットコマンドハンドラ (21 ファイル)
│   │       └── interactions/       # スラッシュコマンドハンドラ (25 ファイル)
│   │
│   ├── request/              # 外部 API クライアント
│   │   ├── openai.ts         # OpenAI / LiteLLM
│   │   ├── youtube.ts        # YouTube API
│   │   └── spotify.ts        # Spotify
│   │
│   ├── services/             # サービス層
│   ├── function/             # ユーティリティ関数
│   ├── reactions.ts          # リアクション処理
│   └── mention.ts            # メンションロジック
│
├── model/                    # データベース層
│   ├── models/               # TypeORM エンティティ (18 モデル)
│   ├── repository/           # リポジトリ (15 ファイル)
│   └── typeorm/              # DataSource 設定
│
├── controller/               # Express ルートハンドラ
├── config/                   # 設定ファイル
├── constant/                 # 定数・定義
├── job/                      # Cron ジョブ
├── common/                   # 共通ユーティリティ
├── service/                  # 追加サービス
├── interface/                # TypeScript インターフェース
└── type/                     # 型定義
```

## メッセージフロー

### ドットコマンド (`.xxx`)

```
ユーザーがメッセージ送信
  → app.ts (messageCreate イベント)
    → MessageManager.execute()
      → コマンド名で Map からハンドラを検索
        → Handler.execute(message, command, args)
          → dot_function 内のビジネスロジックを呼び出し
```

### スラッシュコマンド (`/xxx`)

```
ユーザーがスラッシュコマンド実行
  → app.ts (interactionCreate イベント)
    → InteractionManager.execute()
      → コマンド名で Map からハンドラを検索
        → Handler.execute(interaction)
```

### ボイスチャンネル

```
ユーザーがボイスチャンネルに参加/退出
  → app.ts (voiceStateUpdate イベント)
    → Voice.channelUpdate()
      → ロビーに参加 → 自動ルーム作成
      → ルームが空に → 自動削除 (is_autodelete が有効の場合)
```

## 設計パターン

### Handler パターン
- すべてのコマンドハンドラは `MessageHandler` または `InteractionHandler` インターフェースを実装
- `execute()` メソッドでコマンドを処理

### Repository パターン
- データアクセスはリポジトリ経由で抽象化
- 各エンティティに対応するリポジトリが存在
- ソフトデリート対応 (`deleted_at` カラム)

### Manager パターン
- `MessageManager` / `InteractionManager` が Map ベースでハンドラを管理
- 1 つのハンドラに複数のコマンド名 (エイリアス) をマッピング可能

## 外部 API 連携

| サービス | 用途 | 設定キー |
|---|---|---|
| OpenAI / LiteLLM | AI チャット (複数モデル対応) | `OPENAI.KEY`, `OPENAI.BASE_URL` |
| YouTube Data API | プレイリスト取得・検索 | `YOUTUBE.KEY` |
| OpenWeatherMap | 天気予報 | `FORECAST.KEY` |
| Spotify | 歌詞連携・OAuth | Spotify OAuth 設定 |
| VOICEVOX | テキスト読み上げ | TTS Bot 経由 |

## Cron ジョブ

| スケジュール | 処理内容 |
|---|---|
| `0 0 * * *` (毎日0時) | ユーザーのガチャチケットをリセット |
| `* * * * *` (毎分) | 1時間以上アイドル状態のチャットセッションをクリーンアップ |
