#!/bin/bash
#
# COEIROINK エンジンを起動し、127.0.0.1 でしか待ち受けないエンジンを
# socat で 0.0.0.0:${COEIROINK_BIND_PORT} に中継する。
#
# 環境変数:
#   COEIROINK_ENGINE_PORT  エンジン本体の待受ポート (既定: 50032)
#   COEIROINK_BIND_PORT    コンテナ外に公開するポート (既定: 50022)
#
set -eu

ENGINE_PORT="${COEIROINK_ENGINE_PORT:-50032}"
BIND_PORT="${COEIROINK_BIND_PORT:-50022}"

cd /opt/coeiroink

echo "starting COEIROINK engine (127.0.0.1:${ENGINE_PORT})..."
./engine/engine "$@" &
ENGINE_PID=$!

cleanup() {
  kill "$ENGINE_PID" 2>/dev/null || true
  [ -n "${SOCAT_PID:-}" ] && kill "$SOCAT_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# エンジンが待受を始めるまで待つ (最大 180 秒)
# -f は付けない: HTTP ステータスに関係なく「接続できたら起動済み」とみなす
i=0
while [ "$i" -lt 180 ]; do
  if curl -s -o /dev/null --max-time 3 "http://127.0.0.1:${ENGINE_PORT}/" 2>/dev/null; then
    break
  fi
  if ! kill -0 "$ENGINE_PID" 2>/dev/null; then
    echo "ERROR: engine が起動前に終了しました" >&2
    wait "$ENGINE_PID"
    exit 1
  fi
  i=$((i + 1))
  sleep 1
done

if [ "$i" -ge 180 ]; then
  echo "ERROR: engine が 180 秒以内に応答しませんでした" >&2
  exit 1
fi

echo "engine is up. forwarding 0.0.0.0:${BIND_PORT} -> 127.0.0.1:${ENGINE_PORT}"
socat "TCP-LISTEN:${BIND_PORT},fork,reuseaddr" "TCP:127.0.0.1:${ENGINE_PORT}" &
SOCAT_PID=$!

# どちらかが落ちたらコンテナごと終了させる (systemd の Restart に任せる)。
# socat だけが死んだ場合にプロセスが残り続けないよう、必ず exit する。
set +e
wait -n "$ENGINE_PID" "$SOCAT_PID"
rc=$?
echo "engine または socat が終了しました (rc=${rc})。コンテナを終了します" >&2
exit "$rc"
