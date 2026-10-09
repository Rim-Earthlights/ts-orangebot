# コマンド一覧

## スラッシュコマンド (`/`)

### サーバーコマンド (Guild)

#### 管理

| コマンド | 説明 |
|---|---|
| `/ping` | Ping テスト |
| `/rip <user>` | ユーザーを墓(AFK)チャンネルに移動 (ADMIN 以上) |
| `/dc <user>` | ユーザーをボイスチャンネルから切断 (ADMIN 以上) |
| `/mute <user> <time> <reason>` | ユーザーをミュート。time は**分**単位 (ADMIN 以上) |
| `/timeout <user> <time> <reason>` | ユーザーをタイムアウト。time は**時間**単位 (ADMIN 以上) |
| `/user-type <user_id> <type>` | ユーザー権限を変更 (OWNER/ADMIN/MEMBER/GUEST)。OWNER のみ |
| `/term <command>` | サーバー上でコマンドを実行 (OWNER のみ) |
| `/rust whitelist add <url_or_id>` | Rust whitelist.allow を付与 (利用規約同意済みユーザー) |
| `/rust whitelist revoke <url_or_id>` | Rust whitelist.allow を剥奪 (利用規約同意済みユーザー) |
| `/accept <user>` | ユーザーのルール同意を承認し、メンバーロールを付与 (OWNER のみ) |

#### ユーティリティ

| コマンド | 説明 |
|---|---|
| `/help` | ヘルプを表示 |
| `/nickname [name]` | ニックネーム (みかんからの呼び方) を設定。省略すると表示名に戻す |
| `/speak` | 読み上げ Bot を呼び出す |
| `/discon` | 読み上げ Bot を切断する |
| `/dict add <surface> <pronunciation> <accent_type> [word_type] [priority]` | 読み上げ辞書に単語を登録 |
| `/dict list` | 読み上げ辞書の単語一覧を表示 |
| `/dict remove <uuid>` | 読み上げ辞書から単語を削除 |
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
| `/room name [name]` | ルーム名を変更。省略時は `お部屋: #nnn` に設定 |
| `/room create <name> [live] [private]` | ルームを作成 (private は省略時 ON) |
| `/room live` | 配信モードに設定 |
| `/room limit <limit>` | メンバー上限を設定 |
| `/room add <user>` | ユーザーをルームに追加 |
| `/room remove <user>` | ユーザーをルームから削除 |
| `/room lock` | 自動削除の切り替え |
| `/rn [name]` | ルーム名変更のショートカット。省略時は `お部屋: #nnn` に設定 |

#### AI チャット

| コマンド | 説明 |
|---|---|
| `/chat <text>` | みかんと会話 |
| `/memory` | メモリ機能の切り替え |
| `/pause` | チャットを一時停止 (10分後自動再開) |
| `/resume` | チャットを再開 |

※ `/model` `/delete` `/revert` `/history` `/lyrics` `/cat` は DM コマンドとしてのみ登録されています。

#### 音楽再生

| コマンド | 説明 |
|---|---|
| `/music play <url>` | YouTube URL / プレイリスト名を再生 |
| `/music search <word>` | YouTube で検索して再生 |
| `/music interrupt <target>` | URL またはキュー番号を優先キューに追加 |
| `/music stop` | 再生を停止 |
| `/music remove [num]` | キューからアイテムを削除。num を省略するとキューを全削除 |
| `/music pause` | 一時停止 / 再開 |
| `/music queue` | キューを表示 |
| `/music shuffle` | キューをシャッフル |
| `/music silent` | 再生通知の切り替え |
| `/music mode [name]` | ループ / シャッフルモード切り替え |
| `/music seek <time>` | シーク (秒数 or mm:ss 形式) |

#### プレイリスト

| コマンド | 説明 |
|---|---|
| `/playlist list` | 登録済みプレイリスト一覧を表示 |
| `/playlist add <name> <url>` | プレイリストを登録 |
| `/playlist remove <name>` | プレイリストを削除 |
| `/playlist loop <name> <enabled>` | ループの ON/OFF |
| `/playlist shuffle <name> <enabled>` | シャッフルの ON/OFF |

### DM コマンド

| コマンド | 説明 |
|---|---|
| `/delete [last]` | DM チャット履歴を削除 |
| `/revert [uuid]` | 削除したメッセージを復元。uuid は `/history` から取得できます |
| `/history` | DM 履歴を表示 |
| `/lyrics [query]` | 歌詞を表示 |
| `/model <default\|low\|high>` | AI モデルを切り替え (low / high は `CONFIG.LITELLM.LOW_MODEL` / `HIGH_MODEL`) |
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
| `.dice <num> <max>` | | ダイスを振る (例: `.dice 5 6`)。引数は2つとも必須 |
| `.celo` | | チンチロリンダイスゲーム (3回振り) |
| `.celovs` | | みかんとチンチロリン対戦 |
| `.choose <選択肢1> <選択肢2> ...` | `.choice` / `.ch` | ランダムに1つ選択 |
| `.dall` | | ボイスチャット全員で100面ダイス |
| `.team [num] [?move]` | | ボイスメンバーをチーム分け |

### ガチャ

| コマンド | エイリアス | 説明 |
|---|---|---|
| `.gacha [num\|limit]` | `.g` | ガチャを引く (デフォルト10連) |
| `.gp` | | ガチャ排出率を表示 |
| `.gl` | | 手持ちチケット全消費 |
| `.give <user_id> <item_id>` | | 指定アイテムをプレゼントとして付与 (OWNER のみ) |

### AI チャット

| コマンド | 説明 |
|---|---|
| `.gpt <text>` | GPT (LiteLLM) と会話 |
| `.mikan <text>` | みかんと会話 |
| `.raw <text>` | AI のレスポンスをそのまま表示 |
| `.memory` | メモリ機能の切り替え |
| `.model [default\|g3\|g4] [model]` / `.model-info` | AI モデル設定を表示。引数を指定すると変更 (g3 = `CONFIG.LITELLM.LOW_MODEL`, g4 = `CONFIG.LITELLM.HIGH_MODEL`) |
| `.speech <text>` | テキストから音声を生成 |

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
| `.list add <name> <url>` / `.list reg <name> <url>` | プレイリストを追加 |
| `.list rem <name>` / `.list rm <name>` | プレイリストを削除 |
| `.list loop <name> <on\|off>` / `.list lp` | ループ切り替え |
| `.list shuffle <name> <on\|off>` / `.list sf` | シャッフル切り替え |

### ルーム管理

| コマンド | 説明 |
|---|---|
| `.room name [name]` / `.rn [name]` | ルーム名を変更。省略時は `お部屋: #nnn` に設定 |
| `.room limit <num>` | メンバー上限を設定 (0 以下で無制限、最大 99) |
| `.room live [name]` | 配信モードに設定 |
| `.room delete` / `.room lock` | 自動削除の切り替え |
| `.custom start <team> <limit>` | カスタム (チーム分け) 用ルームを作成 |
| `.custom end [any]` | カスタム用ルームを削除 |

※ `.room` は第1引数をモード (`name` / `limit` / `delete` / `lock` / `live`) として解釈します。`.room <名前>` では名前は変わりません。

### 管理 (OWNER のみ)

| コマンド | 説明 |
|---|---|
| `.popup-rule` | ルール同意用のポップアップを表示 |
| `.relief <num>` | サーバー全員にガチャチケットを `num` 回分配布 (詫び石) |

### 読み上げ (TTS)

`.speak` は bot 本体が処理し、未使用の読み上げ Bot インスタンス (`packages/speak`) を HTTP で呼び出します。それ以外は読み上げ Bot 側が直接処理するコマンドです (コマンド名はインスタンス別 JSON 設定で変更可能、以下はデフォルト)。

| コマンド | エイリアス | 処理する Bot | 説明 |
|---|---|---|---|
| `.speak` | | bot | 読み上げ Bot を呼び出す |
| `.discon` | | speak | 読み上げを停止・切断 |
| `.speaker-config <voice_id> [speed] [pitch] [intonation]` | `.spcon` | speak | 読み上げ設定 (引数なしで現在の設定を表示) |
| `.sp-reload` | | speak | スピーカー ID 一覧を再読込 |
| `.<bot名> <text>` | | speak | 読み上げ Bot の LLM とチャット |

### 天気予報

| コマンド | 説明 |
|---|---|
| `.tenki <地域> [?日数]` | 天気予報を取得 (最大6日) |

### その他

| コマンド | 説明 |
|---|---|
| `.luck` | 今日の運勢を表示 |
| `.pic <prompt>` | プロンプトから画像を生成 |
| `.cat` | 猫の写真を表示 |
| `.topic` | ランダムな話題を表示 |

---

## 読み上げ Bot (`packages/speak`) のスラッシュコマンド

読み上げ Bot インスタンスが独自に登録するコマンドです。

### サーバーコマンド (Guild)

| コマンド | 説明 |
|---|---|
| `/speak` | 読み上げを呼び出す |

### DM コマンド

| コマンド | 説明 |
|---|---|
| `/delete [last]` | LLM とのチャット履歴を削除 |
| `/revert [uuid]` | 最新のチャット履歴を復元 (uuid 指定でその履歴を復元)。※ speak には `/history` が無いため、Bot の説明文にある「uuid は /history から取得」は現状使えない |
| `/spcon <voice_id> [speed] [pitch] [intonation]` | 読み上げの声・スピード・ピッチ・抑揚を設定 |
| `/model-list` | LLM モデル一覧を表示 |
| `/model-set <model>` | LLM モデルを設定 |
