param(
    [string]$Python = "python"
)

$ErrorActionPreference = "Stop"
$pythonCommand = Get-Command $Python -ErrorAction Stop
$env:PYTHON = $pythonCommand.Source
if (-not $env:PLAYWRIGHT_CHANNEL) {
    $env:PLAYWRIGHT_CHANNEL = "chrome"
}

& $Python -m coverage erase
& $Python -m coverage run -m unittest discover -s tests -p "test_main.py"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Python -m coverage report -m
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm audit --audit-level=high
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test:frontend
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test:e2e
exit $LASTEXITCODE
