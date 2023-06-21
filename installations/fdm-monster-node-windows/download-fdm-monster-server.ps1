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

if (Test-Path -Path $repo)
{
    "The repository folder exists, please consider running 'download-update.ps1' instead or clear the subfolder 'fdm-monster'"
    return;
}

# Clone the release by tag
git clone $repoUrl --branch $latestTag

# Visit the FDM Monster server folder
Push-Location $serverPath

# Perform package updates
npm i -g yarn
yarn -v
yarn install --production --pure-lockfile

# Move to the service installation folder
Pop-Location
Push-Location $installationPath

# Install node-windows and the FDM Monster service
yarn install --production

Pop-Location
