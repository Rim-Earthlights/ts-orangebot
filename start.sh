#!/bin/sh
#
# 起動スクリプト
#
# 使い方:
#   ./start.sh bot                       メインの bot を起動
#   ./start.sh speak <config>            読み上げ bot を起動 (config を指定)
#
# 読み上げ bot の config 指定例:
#   ./start.sh speak lemon               -> packages/speak/src/config/lemon.json
#   ./start.sh speak lime                -> packages/speak/src/config/lime.json
#   ./start.sh speak src/config/xxx.json -> 任意のパスをそのまま指定
#
# いずれもプロセスが落ちたら自動で再起動する。
#
set -u

TARGET="${1:-bot}"

case "$TARGET" in
  bot)
    RUN="pnpm --filter @orangebot/bot start"
    ;;
  speak)
    CONFIG="${2:-}"
    if [ -z "$CONFIG" ]; then
      echo "usage: $0 speak <config>   (例: lemon / lime / src/config/xxx.json)" >&2
      exit 1
    fi
    # "lemon" のような短縮指定は src/config/lemon.json に展開する
    # ("/" を含む or .json で終わる場合はパスとしてそのまま使う)
    case "$CONFIG" in
      */* | *.json) ;;
      *) CONFIG="src/config/${CONFIG}.json" ;;
    esac
    RUN="pnpm --filter @orangebot/speak start $CONFIG"
    ;;
  -h | --help | help)
    echo "usage: $0 {bot | speak <config>}" >&2
    exit 0
    ;;
  *)
    echo "unknown target: $TARGET" >&2
    echo "usage: $0 {bot | speak <config>}" >&2
    exit 1
    ;;
esac

echo "server starting... (target: $TARGET)"

# 初回のみ更新・ビルドする (反映したいときは手動で再起動する)
git pull
pnpm install
pnpm run build

# プロセスが落ちたら再起動する
while :
do
  echo "running: $RUN"
  $RUN
  echo "server stopped, restarting..."
  sleep 3
done
