---
layout: default
title: Setting up MonsterPi
parent: Installations
nav_order: 1
permalink: /guides/monsterpi
last_modified_at: 2023-05-05T10:01:00+02:00
---

# Setting up MonsterPi

MonsterPi is a Raspberry Pi image built using CustomPiOS. The repository is [to be found
here](https://github.com/fdm-monster/MonsterPi).
This raspberry pi image includes FDM Monster and MongoDB. 
All released image versions can be downloaded from the [Releases](https://github.com/fdm-monster/MonsterPi/releases) page.

## Latest Version - MonsterPi 0.3.0

**MonsterPi 0.3.0** can be downloaded from Github Releases: [MonsterPi 0.3.0 release](https://github.com/fdm-monster/MonsterPi/releases/tag/0.3.0).
Please unzip the file before flashing it to your SD card.

Older **MonsterPi releases** can be downloaded Github Releases: [MonsterPi releases](https://github.com/fdm-monster/MonsterPi/releases). 

## Installing MonsterPi

Steps:

1) Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)

2) Insert a 16GB+ SD Card of high quality (class 10) and decent brand, **do not save money on this**!

3) Flash the image on the SD card. Do not forget to set the configuration (WiFi, SSH, hostname) according to your
   specifications: ![RaspberryPiImager.png](../images/raspberrypi-imager.png)

4) Insert the SD card into your Raspberry Pi 3 or 4 and power it up (with a recommended 5.1V power supply)

5) Visit [http://monsterpi.local:4000](http://monsterpi.local:4000) to access FDM Monster

6) Alternatively you can visit [http://monsterpi.local](http://monsterpi.local)
   or [https://monsterpi.local (Self-Signed SSL Certificate)](https://monsterpi.local) to access FDM Monster

# Updating FDM Monster in MonsterPi 

I assume you know how to SSH into your MonsterPi. For me the following SSH entry (See `~/.ssh/config`) works well:
```
Host monsterpi
   HostName monsterpi.local
   User yourcustompiuser # replace with your user
   # PasswordAuthentication true # I Do not like using passwords
   IdentityFile ~/.ssh/id_rsa_file # Replace with your SSH Key
   Port 22
```
Personally I like the [VS Code SSH extension](https://code.visualstudio.com/docs/remote/ssh) for this!

# MonsterPi Version 0.3.0+

Run the following commands to change to the `pi` user and execute an update with root elevation.

```
# Change to pi user
sudo su pi

cd /home/pi/scripts

# Deploy the fdm-monster server update
sudo bash ./update-fdm-monster.sh 
```

## Updating MonsterPi manually 0.2.x -> 0.3.0

A couple of things have changed:
- The update script has been rewritten and moved to `/home/pi/scripts`
- The `/home/pi/install-fdm-monster.js` file has been altered
- The `/home/pi/uninstall-fdm-monster.js` file has been altered
- The `/home/pi/fdm-monster-daemon/package.json` file has been altered

You can run these commands to update your server:
```bash
sudo su pi
cd /home/pi/fdm-monster-daemon
rm ./update-fdm-monster.sh
wget https://raw.githubusercontent.com/fdm-monster/MonsterPi/main/src/modules/monsterpi/filesystem/home/pi/fdm-monster-daemon/install-fdm-monster.js
wget https://raw.githubusercontent.com/fdm-monster/MonsterPi/main/src/modules/monsterpi/filesystem/home/pi/fdm-monster-daemon/uninstall-fdm-monster.js
wget https://raw.githubusercontent.com/fdm-monster/MonsterPi/main/src/modules/monsterpi/filesystem/home/pi/fdm-monster-daemon/package.json
sudo chmod +x install-fdm-monster.js
sudo chmod +x uninstall-fdm-monster.js
sudo chmod +x package.json

# Deploy the fdm-monster server update
cd /home/pi/scripts
wget https://raw.githubusercontent.com/fdm-monster/MonsterPi/main/src/modules/monsterpi/filesystem/home/pi/scripts/update-fdm-monster.sh
sudo chmod +x update-fdm-monster.sh
sudo bash ./update-fdm-monster.sh -n --tag 1.5.0
```

## Updating MonsterPi manually 0.1.x -> 0.2.0

This strategy allows you to stick with 0.1.1. I cannot recommend it in the long run however, because the image of 0.2.0
has changed quite a bit.

This script will not install:
- HAProxy
- gencert (SSL certificate generator)
- welcome script

We will be downloading a gist from Github. You can also download the latest version of the file yourself
from [this Github URL](https://github.com/fdm-monster/MonsterPi/blob/main/src/modules/monsterpi/filesystem/home/pi/fdm-monster-daemon/update-fdm-monster.sh).

```
# Change to pi user
sudo su pi

cd /home/pi/fdm-monster-daemon

# Remove the existing (empty placeholder file in MonsterPi 0.1.1)
rm ./update-fdm-monster.sh
# Download new script
wget https://gist.githubusercontent.com/davidzwa/f0e094bd2223a0f1907009d576ad0b77/raw/4cf65be675dc09439873d504acf25abd32cda9c3/update-fdm-monster.sh

# Deploy the fdm-monster server update
sudo bash ./update-fdm-monster.sh 
```
