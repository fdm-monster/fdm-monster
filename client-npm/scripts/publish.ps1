Push-Location "..\"

$client_src = "..\client-vue"
$client_package_json = "${client_src}\package.json"
$client_version = (Get-Content $client_package_json) -join "`n" | ConvertFrom-Json | Select -ExpandProperty "version"

Echo "Publishing version:" ${client_version}
yarn publish --no-git-tag-version --access public --new-version $client_version

Pop-Location
