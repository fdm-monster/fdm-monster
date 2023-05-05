<#
 # Created by D. Zwart
 # Description: Performs all the steps to download and run an initial version of FDM Monster
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
$latestTag = git ls-remote --tags --sort=taggerdate $repoUrl | Select-Object -First 1
# Extract the tag name from the tag reference
$latestTagName = $latestTag.Substring($latestTag.LastIndexOf("/") + 1)
# Output the latest tag name
Write-Host "Latest tag in $repoUrl is $latestTagName"

if (Test-Path -Path $repo) {
    "The repository folder exists, please consider running 'download-update.ps1' instead or clear the subfolder 'fdm-monster'"
    return;
}

# Clone the release by tag
git clone $repoUrl --branch $latestTagName


# Visit the FDM Monster server folder
Push-Location $serverPath

# Perform package updates
npm i -g yarn
yarn -v
yarn install --production --pure-lockfile

# Install node-windows and the FDM Monster service
yarn install --production
