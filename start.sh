#!/bin/sh
echo "server starting..."
while :
do
  yarn run compile
  yarn run dist
  echo "server restarting..."
  sleep 5s
done
