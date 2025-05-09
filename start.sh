#!/bin/sh
echo "server starting..."
while :
do
  git pull
  yarn run build
  yarn run dist
  echo "server restarting..."
  sleep 3s
done
