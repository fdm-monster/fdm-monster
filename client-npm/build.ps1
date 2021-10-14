$client_src = "..\client-vue"
$client_dist = "${client_src}\dist"
$client_package_json = "${client_src}\package.json"
$target_dist = ".\dist"
$target_package_json = ".\package.json"

$client_version = (Get-Content $client_package_json) -join "`n" | ConvertFrom-Json | Select -ExpandProperty "version"

$own_package_json = (Get-Content $target_package_json) -join "`n" | ConvertFrom-Json
$own_package_json.version = $client_version
$own_package_json | ConvertTo-Json | % { [System.Text.RegularExpressions.Regex]::Unescape($_) } | Out-File $target_package_json -encoding UTF8

npm --prefix $client_src run build

Remove-Item -Path "${target_dist}" -Recurse
Copy-Item -Path "${client_dist}\" -Destination "${target_dist}\" -Recurse

npm pack
