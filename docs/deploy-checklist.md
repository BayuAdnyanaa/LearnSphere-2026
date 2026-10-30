# Stage 4 mainnet deploy checklist

Ask Bayu before every step that deploys to `ic` or spends cycles or money.

## Before the deploy

1. Decide dfx 0.31 or icp-cli for the mainnet deploy.
2. Confirm that `dfx.json` maps the `llm` canister to `w36hm-eqaaa-aaaal-qr76a-cai` on `ic`.
   On `ic`, dfx must not create the local mock (`backend/src/llm_mock/`).
3. Confirm that `internet_identity` maps to the remote `rdmx6-...` canister on `ic`.
4. Run `cd frontend && npm test && npm run lint && npm run build`.
5. Run `cd tutor-proxy && npm test`.

## Tutor: the LLM canister path

The DFINITY LLM canister is free during its rollout. That can change, and a paid path already
exists where the caller pays. The global daily cap protects the cycles balance on this path too.

1. Keep `Tutor.GLOBAL_PER_DAY` (1000 calls a day for all learners) active. Do not remove it for
   the LLM canister path.
2. Keep the per-learner limits: 20 questions a day, 10 seconds apart.
3. After the deploy, check today's use as a controller:

   ```sh
   dfx canister call learnsphere_backend tutorUsageToday --network ic
   ```

   It returns the day, today's call count, the cap, the number of learners, the mode and
   whether a proxy is set.
4. Check the backend's cycles balance once a week:

   ```sh
   dfx canister status learnsphere_backend --network ic
   ```

5. Before each later deploy, read the LLM canister's announcements for price changes. If it
   starts to charge, compare the price per call with the cycles balance before you continue.
6. Ask five test questions on mainnet. Bayu judges the quality of the Llama 3.1 8B replies.

## Tutor: the OpenRouter fallback (stays off)

1. Confirm that `tutorUsageToday` shows `mode = variant { llmCanister }` and
   `proxyConfigured = false`.
2. Do not deploy `tutor-proxy/` and do not create an OpenRouter key without Bayu's approval.
3. If Bayu approves the fallback, follow `tutor-proxy/README.md`. Set the key's monthly credit
   limit to $5 before the first call. With that cap, a leaked proxy secret costs at most $5 a
   month.
4. Run the blind model test (`tutor-proxy/scripts/blind-test.mjs`) only after Bayu approves its
   cost of about $0.01.

## After the deploy

1. Log in with a new Internet Identity on the mainnet URL.
2. Pass one quest, fail one quiz, and wait for the cooldown.
3. Open the tutor and ask one question. Confirm that a real model answers, not the local mock.
4. Run `tutorUsageToday` again. The call count must be 1 higher.
