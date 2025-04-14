# OrangeBot-TS

[TypeScript] Discord Bot for Orange-Server.

# Get Ready

1. install node.js or nodenv (16.15.1)
2. run MySQL, create database and user, set privilege.
3. `cp src/config/config.ts.template src/config/config.ts`
4. `vim src/config/config.ts`, set config text.
5. `yarn install`
6. `yarn run dev` run with nodemon
7. `yarn run compile`
8. `yarn run dist` run compiled js (./dist)

# config.tsについて
- 基本はテンプレートに沿えば大丈夫ですが、DISCORD, DB設定の入力は必須です。
- Forecast, GPT, YoutubeのAPIキーは任意ですが、入力するとその機能が使えるようになります。

# 出来ること
- お部屋の自動作成/削除機能
  - ロビーに誰かが入ると、お部屋:(001)のような連番のお部屋が作成される
  - ロビーの人数が0人になると、お部屋を削除する

# コマンド集 (src上にcommitされているもののみ)
## 便利コマンド系

### .help
  - このヘルプを表示します
### .tenki [地域] [?日数]
  -  天気予報を取得する
    - 指定した地域の天気予報を取得します
    - 日数を指定するとその日数後の天気予報を取得します(6日後まで)
### .reg [pref | name | birth] [登録名]
  - ユーザー情報を登録します
    - pref: 都道府県を登録します (例: [.reg pref 東京都])
    - name: 名前を登録します (例: [.reg name ほげほげ])
    - birth: 誕生日を登録します (例: [.reg birth 0101] (1月1日生まれ))
### .dice [ダイスの振る数] [ダイスの面の数]
  - サイコロを振ります (例: [.dice 5 6] (6面体ダイスを5個振る))
### .dall
  - ボイスチャットにいる人全員で100面サイコロを振ります.
  - なにか決めたいときに使えるかも
### .team [チーム数] [?move]
  - ボイスチャットにいる人全員をチーム数で分けます
  - moveを指定するとチーム分け後にメンバーを移動します
### .choose [選択肢1] [選択肢2] ...
  - 選択肢をスペース区切りで入力するとランダムに選びます

## お部屋管理系
### .room [?部屋名]
  - お部屋の名前を変更します。.room nameのみで使うとお部屋: #(連番)の形に戻ります
### .room live [?変更したい名前]
  - お部屋を配信中にします。.room liveのみで使うと部屋名を維持したまま配信中にします。
  - 配信をする際はこちらを打ってから行ってください。
  - 例) お部屋1で.room liveを実行　→　[🔴配信] お部屋1に変更される
### .room delete
  - お部屋の自動削除設定を変更します。自動削除がOFFになった通話部屋は0人になっても削除されません。
  - 削除したい時は非常にお手数ですが入り直してONに戻した後出てください……

## ガチャ系
### .gacha [?回数 or limit] | .g [?回数 or l]
- 10連ガチャを引く(0時に可能回数が10回(上限70まで)増えます)
  - 回数を指定するとその回数分ガチャを引きます
  - limitを指定した場合は今の上限数まで自動で引きます
### .gl
- .gacha limitの短縮形です. 今の上限数まで自動で引きます
### .gp
- 現在のガチャ確率を表示します
### .luck
- 今日の運勢を占います. 結果に特に意味はないです

## みかんと遊ぶ系
### .celo
- チンチロリンを振ります. 3回まで振って役が出たら終わります
### .celovs
- みかんちゃんとチンチロリンで遊びます.

## おしゃべり系
### .gpt [text] | /gpt [text]
- おしゃべり(GPT-4 / 8K tokens) ※config.tsで変更可
### .g3 [text] | /g3 [text]
- おしゃべり(GPT-3 / 16K tokens) ※config.tsで変更可
### .g4 [text] | /g4 [text]
- おしゃべり(GPT-4 / 32K tokens) ※config.tsで変更可

## 読み上げ系(れもんちゃん) ※読み上げbot使用時のみ使用可能
### .speak (コマンド名変更可)
 - 読み上げを開始します
### .speaker-config [ボイス番号] [速度] | .spcon [ボイス番号] [速度] (コマンド名変更可)
 - 読み上げのユーザー設定を変更します
 - 速度は(0.1 - 5.0 | 整数可)で指定できます
### .discon (コマンド名変更可)
 - 読み上げを終了します

## 音楽再生系
### .play [URL] | .pl [URL]
- Youtube の音楽を再生します. プレイリストも可能
### .search [検索ワード] | .sc [検索ワード]
- Youtube から検索して音楽を追加/再生します
### .interrupt [URL] | .pi [URL]
- 曲を1番目に割り込んで予約する
### .interrupt [予約番号] | .pi [予約番号]
- 予約されている曲を1番目に割り込んで予約する
### .stop | .st
- 現在再生中の音楽を止める(次がある場合は次を再生する)
### .shuffle | .sf
- 現在のキューの音楽をシャッフルする
### .rem [予約番号] | .rm [予約番号]
- 予約されている曲を削除する
### .rem all | .rm all
- 予約している曲を全て削除し、音楽再生を中止する
### .q
- 現在のキューを表示する
### .silent | .si
- 音楽再生の通知を切り替えます
- offの場合は次の曲に変わっても通知しなくなりますが, 自動シャッフル時にのみ通知されます
### .mode [lp or sf]
- 音楽再生のモードをON/OFFに切り替えます
  - lp: ループ再生
  - sf: シャッフル再生
### .seek [時間 分:秒 or 秒数]
- 現在の曲の再生位置を変更します. 例) .seek 1:30 or .seek 90
### .pause
- 現在の曲を一時停止 or 再開します

## プレイリスト系
### .list
- 登録されているプレイリストの一覧を表示します
### .list add [名前] [URL]
- プレイリストを登録します
### .list rem [名前] | .list rm [名前]
- プレイリストを削除します
### .list loop [名前] [on | off] | .list lp [名前] [on | off]
- 対象プレイリストのループ処理を書き換えます
### .list shuffle [名前] [on | off] | .list sf [名前] [on | off]
- 対象プレイリストの自動シャッフル処理を書き換えます

# License
### CopyRights
- Copyright (c) 2022-2023 / Rim Earthlights
  - https://twitter.com/Rim_Earthlights
### Modules
- https://gitlab.com/Rim_Earthlights/ts-orangebot/-/blob/main/lisence.txt
