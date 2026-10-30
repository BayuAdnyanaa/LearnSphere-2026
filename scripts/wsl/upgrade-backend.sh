#!/usr/bin/env bash
# Forces a real upgrade that keeps all user progress, even when the wasm is unchanged.
set -euo pipefail
source "$HOME/.local/share/dfx/env"
cd "$(dirname "$0")/../.."
dfx build learnsphere_backend
dfx canister install learnsphere_backend --mode upgrade --upgrade-unchanged --wasm-memory-persistence keep --yes
