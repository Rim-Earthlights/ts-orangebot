# コマンド一覧

## スラッシュコマンド (`/`)

### サーバーコマンド (Guild)

#### 管理

| コマンド | 説明 |
|---|---|
| `/ping` | Ping テスト |
| `/rip <user>` | ユーザーを墓地チャンネルに移動 |
| `/dc <user>` | ユーザーをボイスチャンネルから切断 |
| `/mute <user> <time> <reason>` | ユーザーをミュート |
| `/timeout <user> <time> <reason>` | ユーザーをタイムアウト |
| `/user-type <user_id> <type>` | ユーザー権限を変更 (OWNER/ADMIN/MEMBER/GUEST) |
| `/accept <user>` | ユーザーのルール同意を承認 |

#### ユーティリティ

| コマンド | 説明 |
|---|---|
| `/help` | ヘルプを表示 |
| `/nickname <name>` | ニックネームを設定 |
| `/speak` | 読み上げ Bot を呼び出す |
| `/topic` | ランダムな話題を表示 |

#### ゲーム・ガチャ

| コマンド | 説明 |
|---|---|
| `/dice [num] [max]` | ダイスを振る (num: 回数, max: 面数) |
| `/gacha pick [num] [limit]` | ガチャを引く (デフォルト10連, limit で全部) |
| `/gacha list` | 所持アイテム一覧を表示 |
| `/gacha extra [num] [item]` | テスト引き (報酬なし) |
| `/gc [num] [limit]` | `/gacha` のショートカット |
| `/gl` | 手持ちチケット全消費でガチャ |
| `/ito <round>` | ITO ゲームを開始 |
| `/genito` | ITO のお題を表示 |

#### ルーム管理

| コマンド | 説明 |
|---|---|
| `/room name <name>` | ルーム名を変更 |
| `/room create <name> [live] [private]` | ルームを作成 |
| `/room live` | 配信モードに設定 |
| `/room limit <limit>` | メンバー上限を設定 |
| `/room add <user>` | ユーザーをルームに追加 |
| `/room remove <user>` | ユーザーをルームから削除 |
| `/room lock` | 自動削除の切り替え |
| `/rn <name>` | ルーム名変更のショートカット |

#### AI チャット

| コマンド | 説明 |
|---|---|
| `/chat <text>` | みかんと会話 |
| `/ai start` | AI 会話を開始 |
| `/ai stop` | AI 会話を停止 |
| `/memory` | メモリ機能の切り替え |
| `/model <model>` | AI モデルを変更 (default/low/high) |
| `/delete [last]` | チャット履歴を削除 |
| `/revert [uuid]` | 削除したチャットを復元 |
| `/history` | 会話履歴を表示 |
| `/pause` | チャットを一時停止 (10分後自動再開) |
| `/resume` | チャットを再開 |

#### メディア

| コマンド | 説明 |
|---|---|
| `/lyrics [query]` | 歌詞を表示 (Spotify 連携 or 検索) |
| `/cat` | 猫の写真を表示 |

### DM コマンド

| コマンド | 説明 |
|---|---|
| `/delete [last]` | DM チャット履歴を削除 |
| `/revert [uuid]` | 削除したメッセージを復元 |
| `/history` | DM 履歴を表示 |
| `/lyrics [query]` | 歌詞を表示 |
| `/model <model>` | AI モデルを切り替え |
| `/cat` | 猫の写真を表示 |

---

## ドットコマンド (`.`)

メッセージの先頭に `.` を付けて使用するコマンドです。

### ヘルプ・情報

| コマンド | 説明 |
|---|---|
| `.help` | ヘルプを表示 |

### ユーザー登録

| コマンド | 説明 |
|---|---|
| `.reg pref <都道府県>` | 都道府県を登録 (例: `.reg pref 東京都`) |
| `.reg name <名前>` | 名前を登録 (例: `.reg name ほげほげ`) |
| `.reg birth <MMDD>` | 誕生日を登録 (例: `.reg birth 0101`) |

### ゲーム・ダイス

| コマンド | エイリアス | 説明 |
|---|---|---|
| `.dice [num] [max]` | | ダイスを振る |
| `.celo` | | チンチロリンダイスゲーム (3回振り) |
| `.celovs` | | みかんとチンチロリン対戦 |
| `.choose <選択肢1> <選択肢2> ...` | `.ch` | ランダムに1つ選択 |
| `.dall` | | ボイスチャット全員で100面ダイス |
| `.team [num] [?move]` | | ボイスメンバーをチーム分け |

### ガチャ

| コマンド | エイリアス | 説明 |
|---|---|---|
| `.gacha [num\|limit]` | `.g` | ガチャを引く (デフォルト10連) |
| `.gp` | | ガチャ排出率を表示 |
| `.gl` | | 手持ちチケット全消費 |
| `.give <user> <amount>` | | ガチャチケットを付与 (管理者) |

### AI チャット

| コマンド | 説明 |
|---|---|
| `.gpt <text>` | GPT (LiteLLM) と会話 |
| `.mikan <text>` | みかんと会話 |
| `.raw <text>` | AI のレスポンスをそのまま表示 |
| `.memory` | メモリ機能の切り替え |
| `.model` / `.model-info` | AI モデル情報を表示 |

### 音楽再生

| コマンド | エイリアス | 説明 |
|---|---|---|
| `.play <url>` | `.pl` | YouTube URL / プレイリストを再生 |
| `.search <query>` | `.sc` | YouTube で検索して再生 |
| `.interrupt <url\|num>` | `.pi` | 優先キューに追加 |
| `.stop` | `.st` | 再生を停止 |
| `.rem <num>` | `.rm` | キューからアイテムを削除 |
| `.rem all` | `.rm all` | キューをクリア |
| `.q` | | キューを表示 |
| `.shuffle` | `.sf` | キューをシャッフル |
| `.silent` | `.si` | 再生通知の切り替え |
| `.mode [lp\|sf]` | | ループ / シャッフルモード切り替え |
| `.seek <time>` | | シーク |
| `.pause` | | 一時停止 / 再開 |

### プレイリスト

| コマンド | 説明 |
|---|---|
| `.list` | プレイリスト一覧を表示 |
| `.list add <name> <url>` | プレイリストを追加 |
| `.list rem <name>` / `.list rm <name>` | プレイリストを削除 |
| `.list loop <name> [on\|off]` / `.list lp` | ループ切り替え |
| `.list shuffle <name> [on\|off]` / `.list sf` | シャッフル切り替え |

### ルーム管理

| コマンド | 説明 |
|---|---|
| `.room [name]` / `.rn [name]` | ルーム名を変更 |
| `.room live [name]` | 配信モードに設定 |
| `.room delete` | 自動削除の切り替え |
| `.custom [start\|end]` | カスタムルーム作成 |
| `.popup-rule` | ルールポップアップ |
| `.relief` | リリーフコマンド |

### 読み上げ (TTS)

| コマンド | エイリアス | 説明 |
|---|---|---|
| `.speak` | | 読み上げを開始 |
| `.discon` | | 読み上げを停止 |
| `.speaker-config <voice> <speed>` | `.spcon` | 読み上げ設定 |

### 天気予報

| コマンド | 説明 |
|---|---|
| `.tenki <地域> [?日数]` | 天気予報を取得 (最大6日) |

### その他

| コマンド | 説明 |
|---|---|
| `.luck` | 今日の運勢を表示 |
| `.pic` | ランダムな写真を表示 |
| `.cat` | 猫の写真を表示 |
| `.topic` | ランダムな話題を表示 |
