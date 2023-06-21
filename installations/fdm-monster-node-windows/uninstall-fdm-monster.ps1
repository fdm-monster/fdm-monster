<#
 # Created by D. Zwart
 # Description: Removes the FDM Monster service
 # v1.0
 # 22nd of June, 2023
 #
#>

$ErrorActionPreference = "Stop"

$installationPath = "./fdm-monster/installations/fdm-monster-node-windows"

Push-Location $installationPath
yarn uninstall --production
Pop-Location

"Uninstalling the FDM Monster service complete. Please remove the folder fdm-monster manually."
