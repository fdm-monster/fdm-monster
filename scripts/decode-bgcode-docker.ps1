# PowerShell script to decode a bgcode file using the official libbgcode tool in Docker

param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,

    [Parameter(Mandatory=$false)]
    [string]$OutputFile
)

if (-not (Test-Path $InputFile)) {
    Write-Error "Input file not found: $InputFile"
    exit 1
}

# Set output file
if (-not $OutputFile) {
    $OutputFile = $InputFile -replace '\.bgcode$', '.gcode'
}

# Get absolute paths
$InputAbs = (Resolve-Path $InputFile).Path
$OutputDir = Split-Path (Resolve-Path $OutputFile -ErrorAction SilentlyContinue) -Parent
if (-not $OutputDir) {
    $OutputDir = (Get-Location).Path
}
$OutputName = Split-Path $OutputFile -Leaf

Write-Host "Building Docker image..." -ForegroundColor Cyan
docker build -f Dockerfile.bgcode -t bgcode-decoder .

Write-Host ""
Write-Host "Decoding $InputFile..." -ForegroundColor Cyan
Write-Host "Output will be: $OutputFile" -ForegroundColor Cyan
Write-Host ""

# Run the decoder
docker run --rm `
    -v "${InputAbs}:/data/input.bgcode:ro" `
    -v "${OutputDir}:/output" `
    bgcode-decoder `
    bgcode -i /data/input.bgcode -o /output/$OutputName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Decoded to: $OutputFile" -ForegroundColor Green
    $fileInfo = Get-Item $OutputFile
    Write-Host "File size: $($fileInfo.Length) bytes"
    $lines = (Get-Content $OutputFile | Measure-Object -Line).Lines
    Write-Host "Lines: $lines"
} else {
    Write-Host ""
    Write-Host "ERROR: Decoding failed" -ForegroundColor Red
    exit 1
}
