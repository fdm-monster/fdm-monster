Push-Location "..\"

$client_src = "..\client-vue"
$client_dist = "${client_src}\dist"
$client_package_json = "${client_src}\package.json"
$target_dist = ".\dist"
$target_package_json = ".\package.json"

function Write-PackageJson {
    Param
    (
         [Parameter(Mandatory=$true)]
         [string] $File,
         [Parameter(Mandatory=$true)]
         [string] $Target,
         [Parameter(Mandatory=$true)]
         [string] $Version
    )

    $json_file = (Get-Content $File) -join "`n" | ConvertFrom-Json
    $json_file.version = $Version
    $json_file | ConvertTo-Json | % { [System.Text.RegularExpressions.Regex]::Unescape($_) } | Out-File $Target -encoding UTF8
}

$client_version = (Get-Content $client_package_json) -join "`n" | ConvertFrom-Json | Select -ExpandProperty "version"

# Check version
npm cache clear --force
$versionArray = (npm view @fdm-monster/client versions --json | ConvertFrom-Json)
$lastVersion = $versionArray[$versionArray.Count - 1]
if ($lastVersion -eq $client_version) {
    $v = [version]::New($client_version)
    $v2 = ([version]::New($v.Major,$v.Minor,$v.Build+1)).ToString();

    $title    = 'Package version not new'
    $question = "Increase version from ${v.ToString()} to ${v2}?"
    $choices  = '&Yes', '&No'

    $decision = $Host.UI.PromptForChoice($title, $question, $choices, 1)
    if ($decision  -eq 0) {
        $client_version = $v2
        Write-PackageJson -File $client_package_json -Target $client_package_json -Version $client_version
    }
    else {
        Pop-Location
        Throw "Aborted as package '${client_version}' was not new"
    }
}

Write-PackageJson -File $target_package_json -Target $target_package_json -Version $client_version

Remove-Item -Path "${target_dist}" -Recurse -ErrorAction Ignore
npm --prefix $client_src run build
Copy-Item -Path "${client_dist}\" -Destination "${target_dist}\" -Recurse

npm pack
Pop-Location
