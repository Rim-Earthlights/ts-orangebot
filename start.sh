#!/bin/sh
echo "server starting..."
while :
do
  git pull
  yarn run compile
  yarn run dist
  echo "server restarting..."
  sleep 5s
done
