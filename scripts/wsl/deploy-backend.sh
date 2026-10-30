#!/usr/bin/env bash
# Deploys (or upgrades) the backend and the local Internet Identity, then regenerates
# the frontend declarations. dfx writes both canister IDs to the root .env.
set -euo pipefail
source "$HOME/.local/share/dfx/env"
cd "$(dirname "$0")/../.."
dfx deploy learnsphere_backend "$@"
dfx generate learnsphere_backend
grep CANISTER_ID_ .env
