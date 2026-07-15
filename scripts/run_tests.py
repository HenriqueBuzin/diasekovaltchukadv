"""Run the complete backend, frontend and browser test suite."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def executable(name: str) -> str:
    resolved = shutil.which(name)
    if not resolved:
        raise SystemExit(f"Required executable not found: {name}")
    return resolved


def run(*command: str, env: dict[str, str]) -> None:
    print(f"\n> {' '.join(command)}", flush=True)
    subprocess.run(command, cwd=ROOT, env=env, check=True)


def main() -> int:
    env = os.environ.copy()
    python = env.get("PYTHON", sys.executable)
    npm = executable("npm")

    env["PYTHON"] = python
    if os.name == "nt" and not env.get("PLAYWRIGHT_CHANNEL"):
        env["PLAYWRIGHT_CHANNEL"] = "chrome"

    commands = (
        (python, "-m", "coverage", "erase"),
        (python, "-m", "coverage", "run", "-m", "unittest", "discover", "-s", "tests", "-p", "test_main.py"),
        (python, "-m", "coverage", "report", "-m"),
        (npm, "audit", "--audit-level=high"),
        (npm, "run", "format:frontend:check"),
        (npm, "run", "lint:frontend"),
        (npm, "run", "test:frontend"),
        (npm, "run", "test:e2e"),
    )

    try:
        for command in commands:
            run(*command, env=env)
    except subprocess.CalledProcessError as error:
        return error.returncode

    print("\nAll quality checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
