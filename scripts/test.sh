#!/usr/bin/env sh
set -eu

PYTHON="${PYTHON:-python3}"
export PYTHON

"$PYTHON" -m coverage erase
"$PYTHON" -m coverage run -m unittest discover -s tests -p 'test_main.py'
"$PYTHON" -m coverage report -m

npm ci
npm audit --audit-level=high
npm run test:frontend
npm run test:e2e

