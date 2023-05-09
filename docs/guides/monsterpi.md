---
layout: default
title: Setting up MonsterPi
parent: Installations
nav_order: 1
permalink: /guides/monsterpi
last_modified_at: 2023-09-05T10:03:00+02:00
---
# Setting up MonsterPi

If you're looking to set up MonsterPi on your Raspberry Pi, you're in the right place! MonsterPi is a Raspberry Pi image built using CustomPiOS that allows you to run 3D printers remotely.

## Getting Started

You can find the MonsterPi repository [here](https://github.com/fdm-monster/MonsterPi). Once you have downloaded and flashed the MonsterPi image to your Raspberry Pi, you can SSH into it.

Here is an example SSH configuration that you can use:

```
Host monsterpi
   HostName monsterpi.local
   User yourcustompiuser # replace with your user
   # PasswordAuthentication true # I Do not like using passwords
   IdentityFile ~/.ssh/id_rsa_file # Replace with your SSH Key
   Port 22
```

Alternatively, you can use the [VS Code SSH extension](https://code.visualstudio.com/docs/remote/ssh) for a more user-friendly experience.

## Updating MonsterPi to Version 0.2.0+

If you are using MonsterPi version 0.2.0 or later, you can run the following commands to update the server:

```
sudo su pi
cd /home/pi/fdm-monster-daemon
sudo bash ./update-fdm-monster.sh 
```

## Updating MonsterPi manually from Version 0.1.x to 0.2.0

If you are using MonsterPi version 0.1.x and want to manually update to 0.2.0, you can follow these steps:

1. Download the latest version of the update script from [this Github URL](https://github.com/fdm-monster/MonsterPi/blob/main/src/modules/monsterpi/filesystem/home/pi/fdm-monster-daemon/update-fdm-monster.sh).

2. SSH into your Raspberry Pi and navigate to the `/home/pi/fdm-monster-daemon` directory.

3. Remove the existing (empty placeholder file in MonsterPi 0.1.1) update script with this command: `rm ./update-fdm-monster.sh`.

4. Download the new script with this command: `wget https://gist.githubusercontent.com/davidzwa/f0e094bd2223a0f1907009d576ad0b77/raw/4cf65be675dc09439873d504acf25abd32cda9c3/update-fdm-monster.sh`.

5. Run the update script with root elevation with this command: `sudo bash ./update-fdm-monster.sh`.

Note that this strategy is not recommended in the long run as the image has changed quite a bit between versions.
