#!/bin/sh
#
# Quadlet ユニットを ~/.config/containers/systemd/ に symlink して有効化する。
# リポジトリ側のファイルを編集したらそのまま反映される (daemon-reload は必要)。
#
# 使い方:
#   ./containers/install.sh            設置 + daemon-reload
#   ./containers/install.sh --start    設置 + daemon-reload + 起動
#   ./containers/install.sh --remove   symlink を削除
#
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="${XDG_CONFIG_HOME:-$HOME/.config}/containers/systemd"
UNITS="orangebot-voicevox.container orangebot-coeiroink.container"
SERVICES="orangebot-voicevox orangebot-coeiroink"

case "${1:-}" in
  --remove)
    for u in $UNITS; do
      rm -f "$DEST/$u" && echo "removed: $DEST/$u"
    done
    systemctl --user daemon-reload
    echo "done. (コンテナが動いている場合は systemctl --user stop で止めてください)"
    exit 0
    ;;
esac

mkdir -p "$DEST"
for u in $UNITS; do
  ln -sfn "$DIR/quadlet/$u" "$DEST/$u"
  echo "linked: $DEST/$u -> $DIR/quadlet/$u"
done

systemctl --user daemon-reload
echo "daemon-reload done."

# 再起動後も動かすには linger が必要
if ! loginctl show-user "$(id -u)" -p Linger --value 2>/dev/null | grep -q yes; then
  echo
  echo "NOTE: ログアウト後も動かすには linger を有効にしてください:"
  echo "  sudo loginctl enable-linger $(id -un)"
fi

if [ "${1:-}" = "--start" ]; then
  for s in $SERVICES; do
    echo "starting $s ..."
    systemctl --user start "$s" || echo "  -> 起動に失敗: journalctl --user -u $s を確認してください"
  done
else
  echo
  echo "起動するには:"
  for s in $SERVICES; do
    echo "  systemctl --user start $s"
  done
  echo
  echo "(Quadlet ユニットに [Install] WantedBy=default.target を書いてあるので、"
  echo " linger 有効なら次回ログイン/起動時から自動で立ち上がります。"
  echo " 生成ユニットのため systemctl --user enable は不要かつ使えません)"
fi
