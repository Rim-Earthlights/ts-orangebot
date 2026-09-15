#!/bin/sh
#
# COEIROINK のローカルイメージをビルドする。
#
#   1. https://coeiroink.com/download から Linux CPU 版をダウンロード
#      (例: COEIROINK_LINUX_CPU_v.2.13.0.zip)
#   2. このスクリプトと同じ階層の archive/ に置く
#   3. ./containers/coeiroink/build.sh
#
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE="${COEIROINK_IMAGE:-localhost/orangebot-coeiroink:latest}"

if [ -z "$(find "$DIR/archive" -maxdepth 1 -type f ! -name '.gitkeep' 2>/dev/null)" ]; then
  cat >&2 <<MSG
ERROR: COEIROINK のアーカイブが見つかりません。

  1. https://coeiroink.com/download から Linux CPU 版をダウンロード
     (例: COEIROINK_LINUX_CPU_v.2.13.0.zip)
  2. 次の場所に置いてから再実行してください:
       $DIR/archive/
MSG
  exit 1
fi

echo "building $IMAGE ..."
podman build -t "$IMAGE" -f "$DIR/Containerfile" "$DIR"
echo "done: $IMAGE"
