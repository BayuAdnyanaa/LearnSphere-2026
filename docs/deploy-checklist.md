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

### What "the LLM canister has a paid path" means (checked 2026-10-30)

The repository moved from `github.com/dfinity/llm` to `github.com/caffeinelabs/llm`.

- **Free now:** `llama3.1:8b` (our model), `qwen3:32b`, `llama4-scout` and `qwen2.5:0.5b`.
  **Paid:** `gemma3:27b` and `z-ai:glm-5.2`. Source: `rust/README.md` in that repository.
- The paid path uses the same `v1_chat` method. The model name alone selects free or paid. The
  published Candid has no payment field.
- A paid call is paid in one of two ways (source: `motoko/README.md`, "Paying for models"):
  1. The caller attaches cycles to each call. The libraries attach 100B cycles (about $0.14),
     the model takes what the request costs, and it refunds the rest. A paid call without
     enough attached cycles fails.
  2. Someone deposits a cycles balance up front at `inference.internetcomputer.org`. The LLM
     canister then draws from that balance.
- **The price per call or per token is not published.** The repository and the gateway page show
  only the labels "Free" and "Paid". This is unclear, and I did not guess a number.
- **No date for charging `llama3.1:8b` is announced.** The ICP docs say: "Pricing will be
  announced before the free period ends."

**Can our free call become paid without a code change?** It cannot cost us cycles silently.

- Our backend calls `LLM.v1_chat` directly and attaches no cycles (`main.mo`, `askTutor`). We do
  not use the `mo:llm` library, which in version 3.0.0 attached 100B cycles to every call.
- We have no deposit at the gateway. So no balance exists for the LLM canister to draw from.
- If `llama3.1:8b` becomes paid, our call will most likely fail, and the learner sees "The tutor
  cannot answer right now." This is an inference from the documented minimum, not a stated
  guarantee.
- Unclear: release v1.2.0 adds "allowances" to the LLM canister. Its details are not documented.
  Read them before mainnet. They must not let the LLM canister take cycles from our canister.
- Response if charging starts: switch the mode to `proxy` (after Bayu approves the money), or add
  `with cycles` to the call with a per-call budget and keep `GLOBAL_PER_DAY`.
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
