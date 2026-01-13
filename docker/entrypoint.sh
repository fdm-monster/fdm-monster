#!/bin/sh

if [ -z "$SERVER_PORT" ]
then
    echo "SERVER_PORT=$SERVER_PORT is not defined, the default of 4000 will be assumed. You can override this at any point."
fi

if [ -d "media" ]
then
    mkdir -p media
else
    echo "Media folder already exists..."
fi

# mDNS support ... starting the avahi-daemon
echo "Starting mDNS support via avahi-daemon..."
avahi-daemon --no-chroot --daemonize -f /etc/avahi/avahi-daemon.conf


pm2 start dist/index.js --name FDM --no-daemon -o './media/logs/pm2.log' -e './media/logs/pm2.error.log' --time --restart-delay=1000 --exp-backoff-restart-delay=1500
