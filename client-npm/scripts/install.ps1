npm cache clear --force
$versionArray = (npm view @3d-hub/client versions --json | ConvertFrom-Json)
$lastVersion = $versionArray[$versionArray.Count - 1]

echo  "Running: npm --prefix ..\..\ install --save --save-exact @3d-hub/client@~${lastVersion}"

npm --prefix "..\..\" install --save --save-exact "@3d-hub/client@~${lastVersion}"

