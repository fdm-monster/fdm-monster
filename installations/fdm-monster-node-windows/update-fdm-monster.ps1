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
$installationPath = "./fdm-monster/installations/fdm-monster-node-windows"

# Get tags selecting the newest only
$pattern = "^\d+\.\d+\.\d+$"
$tags = ( git ls-remote --tags --sort="v:refname" --refs $repoUrl | ForEach-Object { $_.Substring($_.LastIndexOf("/") + 1) }) | Where-Object { $_ -match $pattern }
# Pick the latest tag
$latestTag = $tags | Select-Object -Last 1
# Output the latest tag name
Write-Host "Latest tag in $repoUrl is $latestTag"

# Uninstall the service
Push-Location $installationPath
npm run uninstall
Pop-Location

# Visit the FDM Monster server folder
Push-Location $serverPath

# Perform package updates
npm i -g pnpm
pnpm -v
pnpm install --production --pure-lockfile

# Switch to the latest release tag of FDM Monster
git fetch --prune --tags
git checkout $latestTag

# Move to the service installation folder
Pop-Location
Push-Location $installationPath

pnpm install --production

Pop-Location
