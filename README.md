# OrangeBot-TS

[TypeScript] Discord Bot for Orange-Server.

# Get Ready

1. install node.js or nodenv (16.15.1)
2. `cp src/config/config.ts.template src/config/config.ts`
3. `vim src/config/config.ts`, set config text.
4. `yarn install`
5. `yarn run dev` run with nodemon
6. `yarn run compile`
7. `yarn run dist` run compiled js (./dist)

# 出来ること
+ お部屋の自動作成/削除機能
  + ロビーに誰かが入ると、お部屋:(001)のような連番のお部屋が作成される
  + ロビーの人数が0人になると、お部屋を削除する

+ コマンド集
  + > .help
```
 * .tenki [地域]
   > 天気予報を取得する
   > 指定した地域の天気予報を取得します
 * .dice [ダイスの振る数] [ダイスの面の数]
   > サイコロを振る (例: [.dice 5 6] (6面体ダイスを5個振る))
 * .luck [?運勢]
   > おみくじを引く
     運勢を指定するとその運勢が出るまで引きます
 * .gacha [?回数or等級]
   > 10連ガチャを引く
     回数を指定するとその回数回します
     等級を指定するとその等級が出るまで回します
     等級か回数を指定した場合はプレゼントの対象外です
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
 * .list
   > 登録されているプレイリストの一覧を表示します
 * .list add [名前] [URL]
   > プレイリストを登録します
 * .list rem [名前] | .list rm [名前]
   > プレイリストを削除します
 * .celovs
   > チンチロリンで遊ぶ
     みかんちゃんとチンチロリンで遊べます
     3回まで投げて出た目で勝負します
```