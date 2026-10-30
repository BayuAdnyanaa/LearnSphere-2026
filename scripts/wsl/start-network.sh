#!/usr/bin/env bash
# Starts the local ICP network in the foreground. Keep this terminal open:
# on WSL, a --background start dies when the wsl.exe call exits.
set -euo pipefail
source "$HOME/.local/share/dfx/env"
cd "$(dirname "$0")/../.."
dfx start --clean
