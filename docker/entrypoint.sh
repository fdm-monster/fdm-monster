#!/bin/sh

if [ -z "$MONGO" ]
then
    echo "MONGO is not defined, please define the MongoDB connection with the MONGO environment variable"
    exit 1
fi

if [ -z "$SERVER_PORT" ]
then
    echo "SERVER_PORT=$SERVER_PORT is not defined, the default of 4000 will be assumed. You can override this at any point."
fi

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

pm2 start dist/index.js --name FDM --no-daemon -o './logs/pm2.log' -e './logs/pm2.error.log' --time --restart-delay=1000 --exp-backoff-restart-delay=1500
