<#
 # Created by D. Zwart
 # Description: Performs all the steps to update FDM Monster
 # Last change: The script now takes the latest release from github
 # v1.1
 # 05/05/2023
 #
#>

$ErrorActionPreference = "Stop"

$org= "fdm-monster"
$repo= "fdm-monster"
$repoUrl = "https://github.com/${org}/${repo}"
$serverPath = "./fdm-monster/server"

# Get tags selecting the newest only
$latestTag = git ls-remote --tags --sort=-v:refname $repoUrl | Select-Object -First 1
# Extract the tag name from the tag reference
$latestTagName = $latestTag.Substring($latestTag.LastIndexOf("/") + 1)
# Output the latest tag name
Write-Host "Latest tag in $repoUrl is $latestTagName"

# Uninstall the service
npm run uninstall

# Visit the FDM Monster server folder
Push-Location $serverPath

# Perform package updates
npm i -g yarn
yarn -v
yarn install --production --pure-lockfile

# Switch to the latest release tag of FDM Monster
git fetch --prune
git checkout $latestTagName

# Go back and enable the Windows service
Pop-Location
node ./install-fdm-monster-service.js
