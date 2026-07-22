#!/bin/sh
#
# tmux 上で bot / speak (lemon, lime) をまとめて起動するスクリプト
#
# 使い方:
#   ./tmux-start.sh          全プロセスを起動 (更新・ビルドしてから起動)
#   ./tmux-start.sh stop     セッションごと全プロセスを停止
#   ./tmux-start.sh status   起動状況を表示
#
# ログを見る / 操作する:
#   tmux attach -t orangebot
#   (ウィンドウ切替: C-b n / C-b p, デタッチ: C-b d)
#
set -u

SESSION="orangebot"

cd "$(dirname "$0")" || exit 1

case "${1:-start}" in
  start)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      echo "session '$SESSION' is already running. (tmux attach -t $SESSION)" >&2
      exit 1
    fi

    # 更新・ビルドはここで 1 回だけ行う
    # (各ウィンドウの start.sh で並行実行すると git pull / pnpm install が競合するため)
    git pull || exit 1
    pnpm install || exit 1
    pnpm run build || exit 1

    tmux new-session -d -s "$SESSION" -n bot 'SKIP_SETUP=1 ./start.sh bot'
    tmux new-window -t "$SESSION" -n lemon 'SKIP_SETUP=1 ./start.sh speak lemon'
    tmux new-window -t "$SESSION" -n lime 'SKIP_SETUP=1 ./start.sh speak lime'
    tmux select-window -t "$SESSION:bot"

    echo "started. attach: tmux attach -t $SESSION"
    ;;
  stop)
    if tmux kill-session -t "$SESSION" 2>/dev/null; then
      echo "session '$SESSION' stopped."
    else
      echo "session '$SESSION' is not running." >&2
      exit 1
    fi
    ;;
  status)
    if tmux has-session -t "$SESSION" 2>/dev/null; then
      tmux list-windows -t "$SESSION"
    else
      echo "session '$SESSION' is not running."
    fi
    ;;
  -h | --help | help)
    echo "usage: $0 {start | stop | status}" >&2
    exit 0
    ;;
  *)
    echo "unknown command: $1" >&2
    echo "usage: $0 {start | stop | status}" >&2
    exit 1
    ;;
esac
