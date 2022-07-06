$package="@fdm-monster/client"
yarn cache clean $package

$versionArray = (npm view $package versions --json | ConvertFrom-Json)
if ($versionArray.Count -eq 1) {
    $lastVersion = $versionArray
}
else {
    $lastVersion = $versionArray[$versionArray.Count - 1]
}

echo "Installing version ${lastVersion} of package ${package}"

echo  "Running: npm --prefix ..\..\ install --save --save-exact ${package}@${lastVersion}"

yarn --cwd "..\..\server\" remove "${package}"
yarn --cwd "..\..\server\" add --exact "${package}@${lastVersion}"

