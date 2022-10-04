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
> .help
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
   > Youtube の音楽を再生する
 * .stop / .st
   > 音楽の再生を停止する
 * .celovs
   > チンチロリンで遊ぶ
     みかんちゃんとチンチロリンで遊べます
     3回まで投げて出た目で勝負します
```