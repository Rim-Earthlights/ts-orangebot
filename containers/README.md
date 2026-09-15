# 音声エンジンの podman 起動 (Quadlet)

bot (`packages/bot`) と読み上げ Bot (`packages/speak`) が使う音声合成エンジンを podman コンテナで動かすための一式。
systemd の user unit (Quadlet) として管理する。

| エンジン | ホスト側ポート | コンテナ側 | イメージ |
|---|---|---|---|
| VOICEVOX Engine | `127.0.0.1:50021` | 50021 | `docker.io/voicevox/voicevox_engine` (公式 / CPU) |
| COEIROINK Engine | `127.0.0.1:50022` | 50022 → 50032 | ローカルビルド (公式イメージなし) |

どちらも `127.0.0.1` にのみ公開する。bot / speak はローカルホスト宛にしか叩かないため。

## ファイル構成

```
containers/
├── install.sh                          Quadlet ユニットを ~/.config/containers/systemd に symlink
├── quadlet/
│   ├── orangebot-voicevox.container
│   └── orangebot-coeiroink.container
└── coeiroink/
    ├── Containerfile                   公式配布 zip からイメージを作る
    ├── entrypoint.sh
    ├── build.sh
    └── archive/                        ← ここに公式 zip を置く (.gitignore 済み)
```

## セットアップ

### 1. COEIROINK のイメージをビルドする

COEIROINK には公式のコンテナイメージがない (コミュニティ製のものは GPU 専用) ため、
公式配布の Linux CPU 版アーカイブからローカルでイメージを作る。

1. https://coeiroink.com/download から **Linux CPU 版** をダウンロード
   (例: `COEIROINK_LINUX_CPU_v.2.13.0.zip`)
2. `containers/coeiroink/archive/` に置く
3. ビルドする

```sh
./containers/coeiroink/build.sh
```

VOICEVOX のみで使う場合はこの手順を飛ばしてよい (`orangebot-coeiroink` の起動だけ失敗する)。

### 2. Quadlet ユニットを設置する

```sh
./containers/install.sh          # symlink + daemon-reload
./containers/install.sh --start  # 設置してそのまま起動
```

`~/.config/containers/systemd/` にリポジトリ内のファイルへの symlink を張るので、
ユニットを編集したら `systemctl --user daemon-reload` するだけで反映される。

ログアウト後・再起動後も動かすには linger が必要:

```sh
sudo loginctl enable-linger $(id -un)
```

ユニットには `[Install] WantedBy=default.target` を書いてあるため、
linger が有効なら次回起動時から自動で立ち上がる (生成ユニットなので
`systemctl --user enable` は使えない)。

## 操作

```sh
systemctl --user start   orangebot-voicevox   orangebot-coeiroink
systemctl --user stop    orangebot-voicevox   orangebot-coeiroink
systemctl --user restart orangebot-voicevox
systemctl --user status  orangebot-voicevox

# ログ
journalctl --user -u orangebot-voicevox -f
podman logs -f orangebot-voicevox

# 動作確認
curl http://127.0.0.1:50021/version      # VOICEVOX
curl http://127.0.0.1:50022/v1/speakers  # COEIROINK
```

リポジトリルートの `package.json` にショートカットもある:

```sh
pnpm tts:up      # 両方起動
pnpm tts:down    # 両方停止
pnpm tts:status  # 状態表示
```

設置の取り消し:

```sh
systemctl --user stop orangebot-voicevox orangebot-coeiroink
./containers/install.sh --remove
```

## 実装メモ

### VOICEVOX のユーザー辞書

`.dict` 系コマンド (`packages/bot/src/bot/function/dict.ts`) が登録する単語は、
コンテナ内の `/home/user/.local/share/voicevox-engine/user_dict.json` に保存される。
Quadlet のコンテナは `--rm` で毎回作り直されるため、ここをホストの
`~/.local/share/orangebot-voicevox/` にバインドマウントして永続化している。

エンジンはコンテナ内の uid 1001 で動くので、ホスト側のディレクトリは rootless の
subuid 所有になる (ユーザーからは直接読み書きできない)。ユニットの `ExecStartPre` が
毎回 `podman unshare chown -R 1001:1001` するので、手動でのお膳立ては不要。
中身を見たり消したりするときは `podman unshare` 経由で:

```sh
podman unshare cat ~/.local/share/orangebot-voicevox/user_dict.json
podman unshare rm -rf ~/.local/share/orangebot-voicevox   # 辞書ごと初期化
```

### COEIROINK が 50022 で待ち受ける仕組み

COEIROINK v2 のエンジンは `127.0.0.1:50032` に固定でバインドし、バインドアドレスを
変えるオプションがない。コンテナのネットワーク名前空間の中で `127.0.0.1` に張られると
外から到達できないため、`entrypoint.sh` がコンテナ内で socat を立てて
`0.0.0.0:50022 → 127.0.0.1:50032` に中継している。

ポート番号は環境変数で変えられる (`COEIROINK_ENGINE_PORT` / `COEIROINK_BIND_PORT`)。

### アプリ側の接続先

`packages/speak` / `packages/bot` はエンジンの URL を各パッケージの `config.ts` の
`API` から読む (`packages/*/src/config/api.ts`):

- VOICEVOX: `API.VOICEVOX` (既定 `http://127.0.0.1:50021/`) — このセットアップと一致
- COEIROINK: `API.COEIROINK` (既定 `http://127.0.0.1:50022/`) — このセットアップと一致

`API` が無い既存の `config.ts` でも、各パッケージの `config/api.ts` が同じ既定値へ
フォールバックする。

### GPU について

どちらも CPU 版を前提にしている。GPU を使う場合は VOICEVOX なら
`nvidia-ubuntu24.04-*` タグに差し替え、Quadlet に `AddDevice` / CDI 設定
(`nvidia-ctk cdi generate`) を追加する。

## 検証状況

- **VOICEVOX**: 実機で検証済み。Quadlet からの起動、`/version` `/speakers` `/audio_query`
  `/synthesis` の応答、ユーザー辞書がコンテナ再作成をまたいで残ること、healthcheck の
  通過まで確認済み。
- **COEIROINK**: 公式アーカイブが手元になかったため、**エンジン本体では未検証**。
  Containerfile の展開ロジック (zip → `/opt/coeiroink` への正規化)、entrypoint の
  socat 中継 (ホスト 50022 → コンテナ内 127.0.0.1:50032)、Quadlet ユニットと
  healthcheck は、127.0.0.1:50032 にのみバインドするスタブエンジンで検証済み。

COEIROINK のビルドが失敗した場合に見るところ:

- アーカイブ内に `engine/engine` がない → Containerfile が展開結果を表示して止まるので、
  実際の構成に合わせて `find` の条件を調整する
- 起動時に共有ライブラリが足りないと言われる → Containerfile の `apt-get install` に追加する
  (`podman run --rm -it --entrypoint /bin/sh localhost/orangebot-coeiroink` に入って
  `ldd /opt/coeiroink/engine/engine` で確認できる)
- エンジンが 180 秒以内に応答しない → `podman logs orangebot-coeiroink` でエンジン側の
  出力を確認する
- `GLIBC_2.xx not found` で落ちる → Containerfile のベースを `ubuntu:24.04` に上げる
  (その際 `libglib2.0-0` は `libglib2.0-0t64` に名前が変わる)
