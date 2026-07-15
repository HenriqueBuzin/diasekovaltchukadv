param(
    [string]$Poetry = "poetry"
)

$ErrorActionPreference = "Stop"
& $Poetry run python scripts/run_tests.py
exit $LASTEXITCODE
