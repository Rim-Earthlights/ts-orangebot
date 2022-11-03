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

# 出来ること
+ お部屋の自動作成/削除機能
  + ロビーに誰かが入ると、お部屋:(001)のような連番のお部屋が作成される
  + ロビーの人数が0人になると、お部屋を削除する

+ コマンド集
  + > .help
```
===== 便利コマンド系 =====
 * .tenki [地域]
   > 天気予報を取得する
   > 指定した地域の天気予報を取得します
 * .dice [ダイスの振る数] [ダイスの面の数]
   > サイコロを振る (例: [.dice 5 6] (6面体ダイスを5個振る))
===== みかんちゃんと遊ぶ系 =====
 * .luck [?運勢]
   > おみくじを引く
     運勢を指定するとその運勢が出るまで引きます
 * .gacha [?回数or等級]
   > 10連ガチャを引く
     回数を指定するとその回数回します
     等級を指定するとその等級が出るまで回します
     等級か回数を指定した場合はプレゼントの対象外です
 * .celovs
   > チンチロリンで遊ぶ
     みかんちゃんとチンチロリンで遊べます
     3回まで投げて出た目で勝負します
===== 音楽再生系 =====
 * .play [URL] / .pl [URL]
   > Youtube の音楽を再生します。プレイリストも可能
 * .interrupt [URL] | .pi [URL]
   > 曲を1番目に割り込んで予約する
 * .interrupt [予約番号] | .pi [予約番号]
   > 予約番号の曲を1番目に割り込んで予約する
 * .stop | .st
   > 現在再生中の音楽を止める(次がある場合は次を再生する)
 * .shuffle | .sf
   > 現在のキューの音楽をシャッフルする
 * .rem [予約番号] | .rm [予約番号]
   > 予約している曲を削除する
 * .rem all | .rm all
   > 予約している曲を全て削除し、音楽再生を中止する
 * .silent | .sil
   > 音楽再生の通知を切り替えます。
   > offの場合は次の曲に変わっても通知しなくなりますが、自動シャッフル時にのみ通知されます
===== プレイリスト系 =====
 * .list
   > 登録されているプレイリストの一覧を表示します
 * .list add [名前] [URL]
   > プレイリストを登録します
 * .list rem [名前] | .list rm [名前]
   > プレイリストを削除します
 * .list loop [名前] [on | off] | .list lp [名前] [on | off]
   > 対象プレイリストのループ処理を書き換えます
 * .list shuffle [名前] [on | off] | .list sf [名前] [on | off]
   > 対象プレイリストの自動シャッフル処理を書き換えます
```