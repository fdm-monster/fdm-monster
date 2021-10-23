./build.ps1

$target_dist = "..\dist\"

If (Test-Path $target_dist)
{
    ./publish.ps1
    Echo "Released successfully:"

    ./install.ps1
    Echo "Installed successfully:"
}
Else {
    Throw "Release failed as ${target_dist} was not found"
}

