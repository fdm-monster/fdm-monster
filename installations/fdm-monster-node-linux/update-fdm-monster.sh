#!/bin/bash
: '
/**
 * Created by D. Zwart
 * Description: Performs all the steps to update FDM Monster
 * v1.0
 * 05/05/2023
 */
'

# Default variable values

# Function to display script usage
usage() {
 echo "Usage: $0 [OPTIONS]"
 echo "Options:"
 echo " -h, --help              Display this help message"
 echo " -t, --tag               Specify a tag to install, required when using non-interactive mode"
 echo " -n, --non-interactive   Enable non-interactive mode"
}

has_argument() {
    [[ ("$1" == *=* && -n ${1#*=}) || ( ! -z "$2" && "$2" != -*)  ]];
}

extract_argument() {
  echo "${2:-${1#*=}}"
}

# Function to handle options and arguments
handle_options() {
  while [ $# -gt 0 ]; do
    case $1 in
      -h | --help)
        usage
        exit 0
        ;;
      -t | --tag)
        if ! has_argument $@; then
          echo "Tag not specified." >&2
          usage
          exit 1
        fi

        tag=$(extract_argument $@)

        shift
        ;;
      -n | --non-interactive)
        if [ -z ${tag+x} ]; then
          echo "Tag ${tag} not provided, but non-interactive mode was specified. Cant continue." >&2
          usage
          exit 1
        fi
        non_interactive_mode=true
        ;;
      *)
        echo "Invalid option: $1" >&2
        usage
        exit 1
        ;;
    esac
    shift
  done
}

# Main script execution
handle_options "$@"

# Perform the desired actions based on the provided flags and arguments
if [ "$non_interactive_mode" = true ]; then
 echo "Non-interactive mode enabled."
fi
if [ -n "$tag" ]; then
 echo "Tag specified: $tag"
fi

# Step 0) Ensure we are root.
set -e
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root, this script must reinstall a service and, therefore, requires elevated permissions (root)"
  exit
fi

# Step 0b) Set the variables needed later
ts=6 # total steps
org=fdm-monster
repo=fdm-monster
rel_path='..'
server_path="${rel_path}/fdm-monster/"
daemon_path="${rel_path}/fdm-monster-daemon/"
dist_zips_path="${rel_path}/fdm-monster/dist-zips/"
dist_active_path="${rel_path}/fdm-monster/dist-active/"
dist_prefix="dist-server"
repo_url="https://github.com/${org}/${repo}"

## Step 0c) Path creation
echo "[1/${ts}] Ensuring folders are created"
mkdir -p ${server_path}
mkdir -p ${daemon_path}
mkdir -p $dist_active_path
mkdir -p $dist_zips_path

# Step 1) Check latest release of FDM Monster
if [ "$non_interactive_mode" = true ]; then
  echo "[2/${ts}] Installing tag $tag in non-interactive mode"
else
  tags="$(git ls-remote --sort=-v:refname --tags $repo_url | awk -F"/" '{print $NF}')"
  tag=$(echo "$tags" | sort -V | tail -1)

  # Check if the tag contains "-rc" or "-unstable"
  if [[ $tag == *"-rc"* || $tag == *"-unstable"* ]]; then
      echo "Newest tag is $tag which seems to be a release candidate or unstable version."
      echo "Do you want to install this tag(Y) or install the latest stable(N) (Y/N)?"
      read -r response

      if [[ $response == "Y" || $response == "y" ]]; then
          # Install the tag
          echo "[2/${ts}] Installing tag $tag"
      else
          # Search for the latest stable tag in x.y.z format
          tag=$(echo "$tags" | grep -E "^[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+$" | sort -V | tail -1)
          echo "[2/${ts}] Installing latest stable tag: $tag"
      fi
  else
      echo "[2/${ts}] Installing latest stable tag: $tag"
  fi
fi

# Step 3) Check zip asset url
zip_file=${dist_prefix}-${tag}.zip
url="https://github.com/$org/$repo/releases/download/${tag}/${zip_file}"
echo "[3/${ts}] Checking github asset url"
if curl --output /dev/null --silent --head --fail "$url"; then
  echo "URL exists: $url"
else
  echo "URL does not exist: $url. Please check the tag and try again."
  exit;
fi

# Step 4) Temporarily stop FDM Monster Daemon
# `curl 0.0.0.0:4000` will fail to connect, you can test it if you want to be sure
echo "[4/${ts}] Stopping FDM Monster before update"
pushd "${daemon_path}"
npm i node-linux
npm run uninstall

# Step 5) Switch the latest FDM Monster to this tag
echo "[5/${ts}] Downloading version version ${tag} of FDM Monster from Github"
pushd "${server_path}"
curl -fsSL ${url} -o "${dist_zips_path}/${zip_file}"

# Step 6) Clear the old dist folder
echo "[6/${ts}] Clearing old dist folder"
rm -fr $dist_active_path
mkdir -p $dist_active_path

echo "[7a/${ts}] Ensuring 7-zip installed"
dpkg --verify p7zip-full || sudo apt-get install -y p7zip-full

## Step 7) Extract zip file to dist folder
echo "[7b/${ts}] Extracting new dist zip to ${dist_active_path}"
7z x "${dist_zips_path}/${zip_file}" -o"${dist_active_path}"

# Step 8) Ensure yarn is new, (optional)
echo "[8/${ts}] Updating yarn"
npm i -g yarn

# Step 9) Ensure the required packages are present with yarn (which is already installed, we're just keeping it fresh)
echo "[9/${ts}] Updating the necessary modules of FDM Monster"
pushd "${dist_active_path}"
yarn install --production --pure-lockfile --network-timeout 1000000000
popd

# Step 10) Run the service
popd
echo "[10/${ts}] Installing FDM Monster service with version $tag"
npm run install

echo "[11/${ts}] Upgrading FDM Monster completed, you can verify with 'curl http://0.0.0.0:4000'"
popd
