# Tutor fallback proxy

A small Vercel function that the LearnSphere backend canister can call when the DFINITY LLM
canister is not usable. It forwards the tutor's messages to OpenRouter and returns the reply text.

**It is switched off by default** in two places:

- The canister's tutor mode is `llmCanister`. It only calls this proxy after a controller runs
  `setTutorMode(variant { proxy })`.
- The function answers `503` unless the environment variable `TUTOR_PROXY_ENABLED` is `1`.

## Why the proxy has its own limits

The OpenRouter key lives only in a Vercel environment variable. It is never in the canister.

The canister sends a shared secret in the `x-tutor-secret` header. That secret is **not
confidential**: it sits in canister memory, and the node operators of the subnet can read
canister memory. So the proxy trusts nothing from its caller. It enforces these rules itself
(see `lib/tutor.js`):

| Rule | Value |
|---|---|
| Model | pinned to `anthropic/claude-haiku-5.5`, the caller cannot change it |
| Reply length | `max_tokens` forced to 400 |
| Request body | at most 12 KB, at most 10 messages, roles `system`/`user`/`assistant` only |
| Browser calls | refused (`403`) when the request has an `Origin` header |
| Secret | compared in constant time, `401` when wrong |
| Daily spend | `429` when the key's `usage_daily` reaches `DAILY_USD_CAP` (checked every 60 s) |
| Daily messages | `429` after `DAILY_MESSAGE_CAP` calls on one warm instance |
| Monthly spend | `429` when OpenRouter reports `limit_remaining` ≤ 0 |

**Worst case if the secret leaks: $5 per month.** The key's monthly spending cap on OpenRouter
is the hard backstop. Anyone with the secret can spend at most that cap, and nothing more.
The daily cap normally stops them much earlier.

One reply costs about $0.0005 (a full 12 KB request plus 400 output tokens at the Haiku 5.5
price of $0.10 / $0.50 per million tokens). The $0.25 daily cap is about 500 replies a day.
The daily spend check uses a 60-second cache, so a burst can pass the daily cap by a few cents.
The monthly cap still holds.

## Set up (only after Bayu approves the money)

1. On openrouter.ai, create a key only for this proxy.
2. Set the key's credit limit to **$5** with a **monthly** reset.
3. Create a Vercel project with this folder (`tutor-proxy/`) as the root directory.
4. Set these environment variables in Vercel:

   | Name | Value |
   |---|---|
   | `OPENROUTER_API_KEY` | the key from step 1 |
   | `TUTOR_SECRET` | a long random string, for example `openssl rand -hex 32` |
   | `TUTOR_PROXY_ENABLED` | `1` |
   | `DAILY_USD_CAP` | `0.25` |
   | `DAILY_MESSAGE_CAP` | `1000` |

5. Deploy. The function URL is `https://<project>.vercel.app/api/tutor`.
6. As a controller of the backend canister, set the URL and the secret, then switch the mode:

   ```sh
   dfx canister call learnsphere_backend setTutorProxy '("https://<project>.vercel.app/api/tutor", "<TUTOR_SECRET>")' --network ic
   dfx canister call learnsphere_backend setTutorMode '(variant { proxy })' --network ic
   ```

Vercel Hobby is free but allows only non-commercial, personal use.

## Rotate the secret

1. Make a new random string.
2. Set it as `TUTOR_SECRET` in Vercel and redeploy.
3. Run `setTutorProxy` again with the same URL and the new secret.

Tutor calls fail with "unavailable" between steps 2 and 3. `setTutorProxy` is controller-only.

## Switch it off

- Run `dfx canister call learnsphere_backend setTutorMode '(variant { llmCanister })' --network ic`, or
- set `TUTOR_PROXY_ENABLED` to `0` in Vercel, or
- delete the OpenRouter key.

## Test locally (no key, no money)

```sh
npm test                       # unit checks with a fake OpenRouter
node scripts/local-server.mjs  # the proxy rules on port 8787, with a fake OpenRouter
```

`scripts/local-server.mjs` explains how to point the local canister at it. `GET /last` shows the
last request that the fake OpenRouter received.

## Blind model test (not run yet)

`scripts/blind-test.mjs` sends the 20 questions in `blind-test/questions.json` to Claude Haiku 5.5
and Gemini 2.5 Flash-Lite with the real tutor prompt. It writes the replies as A/B pairs in a random
order to `blind-test/out/replies-for-bayu.md`, and the model key to `blind-test/out/key.json`
(both gitignored). It costs about $0.01 and needs a real key, so it refuses to run without
`--approved-by-bayu`.
