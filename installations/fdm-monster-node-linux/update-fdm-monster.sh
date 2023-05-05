#!/bin/bash
: '
/**
 * Created by D. Zwart
 * Description: Performs all the steps to update FDM Monster
 * v1.0
 * 05/05/2023
 */
'

# If you are logging in as pi user, you can skip the sudo su pi command.
# I decided to switch to the pi user with sudo su pi beforehand as I was logging in as david.
# Then I went to the folder /home/pi/fdm-monster-daemon/ with the command cd ~/fdm-monster-daemon.
# Then I ran the script I made sudo ./update-fdm-monster.sh.

# Step 0) Ensure we are root.
set -e
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root, this script must reinstall a service and, therefore, requires elevated permissions (root)"
  exit
fi

# Step 0b) Set the variables needed later
ts=6 # total steps
temp_updates_dir=temp-updates
org=fdm-monster
repo=fdm-monster
repo_url="https://github.com/${org}/${repo}"

# Step 1) Check latest release of FDM Monster
tag=$(git ls-remote --tags $repo_url | awk -F"/" '{print $NF}' | grep -E "^[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+$" | sort -V | tail -1)
echo "[1/${ts}] Found the latest release ${tag}"

# Step 2) Temporarily stop FDM Monster Daemon
# `curl 0.0.0.0:4000` will fail to connect, you can test it if you want to be sure
echo "[2/${ts}] Stopping FDM Monster before an update"
npm run uninstall

# Step 3) Switch the latest FDM Monster to this tag
pushd ../fdm-monster/server/
echo "[3/${ts}] Finding the latest version of FDM Monster from Github"
git fetch
git checkout $tag

# Step 4a) Ensure yarn is new, (optional)
# npm i -g yarn

# Step 4) Ensure the required packages are present with yarn (which is already installed, we're just keeping it fresh)
echo "[4/${ts}] Updating the necessary modules of FDM Monster"
yarn install --production --pure-lockfile

# Step 5) Run the service
popd
echo "[5/${ts}] Installing FDM Monster version ${tag}"
npm run install

echo "[6/${ts}] Upgrading FDM Monster completed"
