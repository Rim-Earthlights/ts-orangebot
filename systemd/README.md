# bot / 読み上げ bot の systemd 起動

本番環境で bot (`packages/bot`) と読み上げ bot (`packages/speak`) を systemd の user unit として動かすための一式。
落ちたら自動で再起動し、マシンの再起動後も自動で立ち上がる。

| ユニット | 動かすもの |
|---|---|
| `orangebot-bot.service` | メインの bot (`pnpm start` in `packages/bot`) |
| `orangebot-speak@<name>.service` | 読み上げ bot (`pnpm start src/config/<name>.json` in `packages/speak`) |

音声エンジン (VOICEVOX / COEIROINK) は別途 [containers/README.md](../containers/README.md) の Quadlet で動かす。

## ファイル構成

```
systemd/
├── install.sh                  ユニットを ~/.config/systemd/user に symlink して enable
├── orangebot-bot.service
└── orangebot-speak@.service    テンプレート (インスタンス名 = 設定ファイル名)
```

## セットアップ

事前に `pnpm install` と `pnpm build` を済ませておく (ユニットはビルドしない)。

```sh
./systemd/install.sh lemon lime          # 設置 + bot と speak@lemon / speak@lime を enable
./systemd/install.sh --start lemon lime  # 上に加えて起動 (動いていれば再起動)
```

`install.sh` は次を行う:

- リポジトリ内のユニットファイルを `~/.config/systemd/user/` に symlink する
- 作業ディレクトリと `PATH` を drop-in (`~/.config/systemd/user/<unit>.d/env.conf`) に書き出す
  - `PATH` は **実行したシェルのもの** をそのまま使う (node / pnpm が mise 管理であることと、
    bot が `/term` や rcon で外部コマンドを呼ぶため)
  - リポジトリを移動したり、node のバージョンを変えたりしたら再実行する
- `systemctl --user enable` する

ログアウト後・再起動後も動かすには linger が必要 (このマシンでは有効化済み):

```sh
sudo loginctl enable-linger $(id -un)
```

`./start.sh` で動かしている bot がある場合は、二重に起動しないよう先に止めてから
systemd 側を起動する (同じトークンで 2 つ動くと応答が重複する)。

## 更新

更新は手動で行う:

```sh
git pull
pnpm install
pnpm build
systemctl --user restart orangebot-bot 'orangebot-speak@*'
```

## 操作

```sh
systemctl --user status  orangebot-bot orangebot-speak@lemon orangebot-speak@lime
systemctl --user restart orangebot-bot
systemctl --user stop    'orangebot-speak@*'

# ログ
journalctl --user -u orangebot-bot -f
journalctl --user -u orangebot-speak@lemon -f
# ↑ で "No journal files were found" になる環境では (user 用ジャーナルが無い)
journalctl _SYSTEMD_USER_UNIT=orangebot-bot.service -f
```

読み上げ bot を増やすときは `packages/speak/src/config/<name>.json` を用意して:

```sh
systemctl --user enable --now orangebot-speak@<name>
```

設置の取り消し (停止 + disable + symlink / drop-in の削除):

```sh
./systemd/install.sh --remove
```

## トラブルシューティング

### `Failed to connect to user scope bus via local transport: Connection refused`

`systemctl --user` は既定で user manager の直通ソケット (`$XDG_RUNTIME_DIR/systemd/private`) を使う。
これが壊れていると (このマシンで 2026-10 に発生) 上のエラーになるが、D-Bus 経由なら操作できる:

```sh
SYSTEMCTL_FORCE_BUS=1 systemctl --user status orangebot-bot
SYSTEMCTL_FORCE_BUS=1 ./systemd/install.sh lemon lime   # install.sh 内の systemctl にも効く
```

常用するならシェルの設定で `SYSTEMCTL_FORCE_BUS=1` を export しておく。
直通ソケットは user manager を再実行すれば作り直される (動いているサービスはそのまま):

```sh
SYSTEMCTL_FORCE_BUS=1 systemctl --user daemon-reexec
```

## 実装メモ

- `Restart=always` / `RestartSec=5` / `StartLimitIntervalSec=0` で、落ちても諦めずに再起動し続ける。
  bot は DB 初期化や Discord へのログインに失敗すると終了するので、起動時に MariaDB
  (system 側のサービスで、user unit からは順序を指定できない) がまだ上がっていなくても、
  再起動を繰り返すうちにつながる。
- user manager では `network-online.target` を実際には待てないが、上と同じく再起動で吸収する。
- 停止時は SIGTERM を送り、アプリ側の終了処理 (10 秒でタイムアウト) を待つ。`TimeoutStopSec=30`。
- `ExecStart` は `/usr/bin/env pnpm ...` にしている。systemd は相対パスのコマンドを
  `Environment=PATH` ではなく自前の固定パスから探すため。
