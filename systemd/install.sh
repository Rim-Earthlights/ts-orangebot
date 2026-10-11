#!/bin/sh
#
# bot / 読み上げ bot の systemd user unit を ~/.config/systemd/user/ に symlink して有効化する。
# リポジトリ側のファイルを編集したらそのまま反映される (daemon-reload は必要)。
#
# 使い方:
#   ./systemd/install.sh lemon lime            設置 + bot と speak@lemon, speak@lime を enable
#   ./systemd/install.sh --start lemon lime    上に加えて起動 (動いていれば再起動) する
#   ./systemd/install.sh --remove              停止 + disable + symlink / drop-in を削除
#
# 読み上げ bot の名前は packages/speak/src/config/<name>.json に対応する。
# 作業ディレクトリと PATH (実行したシェルのもの) は drop-in に書き出すので、
# リポジトリを移動したり node のバージョンを変えたりしたら再実行する。
#
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(dirname "$DIR")"
DEST="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNITS="orangebot-bot.service orangebot-speak@.service"

case "${1:-}" in
  --remove)
    # 動いている / enable 済みの speak インスタンスも含めて止める
    SPEAK="$(
      {
        systemctl --user list-units --all --plain --no-legend 'orangebot-speak@*' | awk '{print $1}'
        ls "$DEST/default.target.wants" 2>/dev/null | grep '^orangebot-speak@.*\.service$'
      } | sort -u
    )"
    for s in orangebot-bot.service $SPEAK; do
      systemctl --user disable --now "$s" 2>/dev/null && echo "disabled: $s" || true
    done
    for u in $UNITS; do
      rm -f "$DEST/$u" && echo "removed: $DEST/$u"
      rm -rf "$DEST/$u.d" && echo "removed: $DEST/$u.d"
    done
    systemctl --user daemon-reload
    echo "done."
    exit 0
    ;;
esac

START=0
if [ "${1:-}" = "--start" ]; then
  START=1
  shift
fi

# 指定された読み上げ bot の設定ファイルがあるか確かめる
for name in "$@"; do
  if [ ! -f "$REPO/packages/speak/src/config/$name.json" ]; then
    echo "not found: packages/speak/src/config/$name.json" >&2
    exit 1
  fi
done

if ! command -v node >/dev/null || ! command -v pnpm >/dev/null; then
  echo "node / pnpm が見つかりません (PATH を確認してください)" >&2
  exit 1
fi
# bot は /term や rcon などで外部コマンドも呼ぶので、手で起動したときと同じく
# 実行したシェルの PATH をそのまま使う
UNIT_PATH="$PATH"

mkdir -p "$DEST"
for u in $UNITS; do
  ln -sfn "$DIR/$u" "$DEST/$u"
  echo "linked: $DEST/$u -> $DIR/$u"
done

# 環境依存の値 (リポジトリの場所・PATH) は drop-in に書き出す
write_dropin() {
  unit="$1"
  workdir="$2"
  mkdir -p "$DEST/$unit.d"
  # ユニットファイルでは % が指定子として展開されるので %% にエスケープする
  cat > "$DEST/$unit.d/env.conf" <<EOF
# ./systemd/install.sh が生成 (手で編集しない)
[Service]
WorkingDirectory=$(printf '%s' "$workdir" | sed 's/%/%%/g')
Environment="PATH=$(printf '%s' "$UNIT_PATH" | sed 's/%/%%/g')"
EOF
  echo "wrote:  $DEST/$unit.d/env.conf"
}
write_dropin orangebot-bot.service "$REPO/packages/bot"
write_dropin orangebot-speak@.service "$REPO/packages/speak"

systemctl --user daemon-reload
echo "daemon-reload done."

SERVICES="orangebot-bot.service"
for name in "$@"; do
  SERVICES="$SERVICES orangebot-speak@$name.service"
done

for s in $SERVICES; do
  systemctl --user enable "$s"
done

# 再起動後も動かすには linger が必要
if ! loginctl show-user "$(id -u)" -p Linger --value 2>/dev/null | grep -q yes; then
  echo
  echo "NOTE: ログアウト後・再起動後も動かすには linger を有効にしてください:"
  echo "  sudo loginctl enable-linger $(id -un)"
fi

if [ "$START" = 1 ]; then
  for s in $SERVICES; do
    echo "starting $s ..."
    systemctl --user restart "$s" || echo "  -> 起動に失敗: journalctl --user -u $s を確認してください"
  done
else
  echo
  echo "起動するには (./start.sh で動かしている場合は先に止める):"
  echo "  systemctl --user start $SERVICES"
fi
