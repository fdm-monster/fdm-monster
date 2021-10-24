npm cache clear --force
$package="@3d-hub/client"
$versionArray = (npm view $package versions --json | ConvertFrom-Json)
if ($versionArray.Count -eq 1) {
    $lastVersion = $versionArray
}
else {
    $lastVersion = $versionArray[$versionArray.Count - 1]
}

echo "Installing version ${lastVersion} of package ${package}"

echo  "Running: npm --prefix ..\..\ install --save --save-exact ${package}@${lastVersion}"

npm --prefix "..\..\" install --save --save-exact "${package}@${lastVersion}"

