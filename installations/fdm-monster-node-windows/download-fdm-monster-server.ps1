<#
 # Created by D. Zwart
 # Description: Performs all the steps to download and run an initial version of FDM Monster
 # Last change: The script now ignores RC versions
 # v1.2
 # 22nd of June, 2023
 #
#>

$ErrorActionPreference = "Stop"

$org = "fdm-monster"
$repo = "fdm-monster"
$serverPath = "./fdm-monster/"
#$installationPath = "./fdm-monster/installations/fdm-monster-node-windows"

# Clone the release by tag
if (-not (Test-Path $serverPath)) {
    mkdir -p $serverPath
}

# Visit the FDM Monster server folder
Push-Location $serverPath
#cd $serverPath
yarn add @fdm-monster/server

# Perform package updates
npm i -g yarn
yarn -v
yarn install --production --pure-lockfile

# Move to the service installation folder
#Pop-Location
#Push-Location $installationPath

# Install node-windows and the FDM Monster service
yarn install --production

Pop-Location
