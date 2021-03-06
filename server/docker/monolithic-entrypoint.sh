#!/bin/sh
mkdir -p /data/db
nohup sh -c mongod --dbpath /data/db &

pwd
ENV MONGO=mongodb://127.0.0.1:27017/fdm-monster

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

pm2 start app.js --name FDM --no-daemon -o './logs/pm2.log' -e './logs/pm2.error.log' --time  --restart-delay=1000 --exp-backoff-restart-delay=1500
