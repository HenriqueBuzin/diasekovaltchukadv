param(
    [string]$VenvPath = "C:\Users\henri\Documents\Projects\venv\diasekovaltchukadv"
)

$ErrorActionPreference = "Stop"
$python = Join-Path $VenvPath "Scripts\python.exe"
if (-not (Test-Path -LiteralPath $python)) {
    throw "Virtual environment not found: $VenvPath"
}

$env:VIRTUAL_ENV = $VenvPath
$env:Path = "$(Join-Path $VenvPath 'Scripts');$env:Path"

& $python -m pre_commit install --overwrite
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$hooksDir = Join-Path $PSScriptRoot "..\.git\hooks"
$binDir = Join-Path $hooksDir "bin"
$hookPath = Join-Path $hooksDir "pre-commit"
$posixVenv = $VenvPath.Replace("\", "/")

New-Item -ItemType Directory -Force -Path $binDir | Out-Null

$hook = Get-Content -LiteralPath $hookPath -Raw
$pathSetup = @"
HERE="`$(cd "`$(dirname "`$0")" && pwd)"
VENV='$posixVenv'
export VIRTUAL_ENV="`$VENV"
export PATH="`$HERE/bin:`$VENV/Scripts:`$PATH"
"@
$hook = $hook.Replace('HERE="$(cd "$(dirname "$0")" && pwd)"', $pathSetup.TrimEnd())
Set-Content -LiteralPath $hookPath -Value $hook -Encoding ascii

$posixShim = @"
#!/bin/sh
VENV='$posixVenv'
export VIRTUAL_ENV="`$VENV"
exec "`$VENV/Scripts/python.exe" -m poetry "`$@"
"@
Set-Content -LiteralPath (Join-Path $binDir "poetry") -Value $posixShim.TrimStart() -Encoding ascii

$windowsShim = @"
@echo off
set "VIRTUAL_ENV=$VenvPath"
"%VIRTUAL_ENV%\Scripts\python.exe" -m poetry %*
"@
Set-Content -LiteralPath (Join-Path $binDir "poetry.cmd") -Value $windowsShim.TrimStart() -Encoding ascii
Set-Content -LiteralPath (Join-Path $binDir "poetry.bat") -Value $windowsShim.TrimStart() -Encoding ascii

Write-Host "Pre-commit configured with Poetry from $VenvPath"
