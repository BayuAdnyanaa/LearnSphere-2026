# Deploy day runbook (first mainnet deploy)

For Bayu. Do the steps in this order. Run the WSL commands in WSL Ubuntu, in `/mnt/c/dev/LearnSphere`,
after `source ~/.local/share/dfx/env`. Run the Windows commands in a Windows terminal.

**Stop rule:** if a command prints an error, or its output differs from "Expect", stop. Do not run
the next step. Keep the output for the person who helps you.

**Password:** from step 2 on, dfx asks for the `learnsphere-prod` password on every command
that uses that identity. Steps that create or change something are marked **(password)**.

WARNING: Never type the password or paste the PEM file into a chat, a file or the repo.

## Before the day

- Bayu has decided: the custom domain, the ICP purchase, the backup controller and the place for
  the PEM backup.
- `cd frontend && npm test && npm run lint` passes on Windows.
- The local login check passes: `node scripts/login-check.mjs` (local network and Vite running).

## A. Identity and cycles

| # | Where | Command | Expect |
|---|---|---|---|
| 1 | WSL | `dfx identity new learnsphere-prod --storage-mode password-protected` **(password)** | `Created identity: "learnsphere-prod".` Choose a new, long password. |
| 2 | WSL | `dfx identity use learnsphere-prod` | `Using identity: "learnsphere-prod".` |
| 3 | WSL | `dfx identity get-principal` | One principal, like `abcde-...-cai`. Write it down. |
| 4 | WSL | `dfx identity export learnsphere-prod > /tmp/lsp.pem`, copy it to the backup place, then `shred -u /tmp/lsp.pem` | The backup holds an encrypted PEM. No copy stays in `/tmp`. |
| 5 | WSL | `dfx ledger account-id --network ic` | A 64-character hex account ID. |
| 6 | Exchange | Withdraw about 2.5 ICP to the account ID from step 5. | The exchange shows the withdrawal as done. |
| 7 | WSL | `dfx ledger balance --network ic` | About `2.5 ICP` (less the fees). |
| 8 | WSL | `dfx cycles convert --help`, then `dfx cycles convert --amount 2.3 --network ic` **(password)** | A message that the cycles balance grew. |
| 9 | WSL | `dfx cycles balance --network ic` | At least `4.000 TC`. **If it is lower, stop.** |

## B. Canisters

| # | Where | Command | Expect |
|---|---|---|---|
| 10 | WSL | `dfx canister create learnsphere_backend --network ic --with-cycles 3000000000000` **(password)** | `learnsphere_backend canister created on network ic with canister id: ...` |
| 11 | WSL | `dfx canister create learnsphere_frontend --network ic --with-cycles 1000000000000` **(password)** | The same line for `learnsphere_frontend`. dfx writes both IDs to `canister_ids.json`. |
| 12 | WSL | `dfx canister update-settings learnsphere_backend --freezing-threshold 7776000 --network ic` **(password)** | No error. 7776000 seconds = 90 days. |
| 13 | WSL | `dfx deploy learnsphere_backend --network ic` **(password)** | `Deployed canisters.` dfx does not create `llm` or `internet_identity`: on ic they are the real remote canisters. |
| 14 | Windows | `cd frontend && npm run build` | `built in ...`. If it says `CANISTER_ID_LEARNSPHERE_FRONTEND is missing`, stop. |
| 15 | WSL | `dfx deploy learnsphere_frontend --network ic` **(password)** | A URL `https://<frontend-id>.icp0.io/`. |
| 16 | WSL | `dfx canister update-settings learnsphere_backend --add-controller <backup principal> --network ic` **(password)**, and the same for `learnsphere_frontend` | No error. |
| 17 | WSL | `dfx canister info learnsphere_backend --network ic`, and the same for `learnsphere_frontend` | Controllers: the step 3 principal and the backup principal. No other. |

## C. Smoke test

| # | Where | Action | Expect |
|---|---|---|---|
| 18 | Browser | Open the URL from step 15. Log in with Internet Identity. | The id.ai page opens, and after sign-in the star map shows. **If the login fails, stop.** The canisters hold no user data yet. |
| 19 | Browser | Open quest 1, read the page, pass the quiz. | "Passed", and the headline says "1 of 12 stars lit". |
| 20 | Browser | Ask the tutor one question. | A real answer, not "[Local mock ...]". |
| 21 | WSL | `dfx canister call learnsphere_backend tutorUsageToday --network ic` | `calls = 1`, `mode = variant { llmCanister }`, `proxyConfigured = false`. |
| 22 | WSL | `dfx canister status learnsphere_backend --network ic`, and the same for `learnsphere_frontend` | Balances near 2.5T and 0.5T. Write down the "Idle cycles burned per day". |
| 23 | WSL | `curl -s https://<frontend-id>.icp0.io/.well-known/ii-alternative-origins` | `{"alternativeOrigins":[]}` |

## D. After the deploy

1. Commit `canister_ids.json`. Canister IDs are public.
2. Switch back to local work: `dfx identity use default`, start the local network, and run
   `dfx deploy learnsphere_backend` again. This writes the local IDs back into `.env`.
3. Fill in the warning limits in `docs/deploy-checklist.md` with the idle burn from step 22.

CAUTION: Do not run `npm run dev` while `.env` holds the mainnet IDs from step 13. The local app
would then talk to the mainnet canisters.

CAUTION: Never use `--mode reinstall` on mainnet. It deletes all learner progress.
