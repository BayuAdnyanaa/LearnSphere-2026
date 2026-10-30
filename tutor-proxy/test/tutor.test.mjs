// Unit checks for the proxy rules, with a fake OpenRouter: no key and no money involved.
import { test } from "node:test";
import assert from "node:assert/strict";
import { handleTutor, newState, MODEL, MAX_TOKENS } from "../lib/tutor.js";

const ENV = { TUTOR_PROXY_ENABLED: "1", TUTOR_SECRET: "s3cret", OPENROUTER_API_KEY: "sk-test", DAILY_USD_CAP: "0.25", DAILY_MESSAGE_CAP: "3" };
const MESSAGES = [{ role: "system", content: "Rules" }, { role: "user", content: "What is a canister?" }];

// A fake fetch that records the calls; usage and the model reply are adjustable
function fakeOpenRouter({ usageDaily = 0, limitRemaining = 4.5, chatStatus = 200, text = "A canister is a smart contract." } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.endsWith("/api/v1/key")) {
      return { ok: true, status: 200, json: async () => ({ data: { usage_daily: usageDaily, limit_remaining: limitRemaining } }) };
    }
    return { ok: chatStatus === 200, status: chatStatus, json: async () => ({ choices: [{ message: { content: text } }] }) };
  };
  return { fetchImpl, calls };
}

const request = (over = {}) => ({
  method: "POST",
  headers: { "x-tutor-secret": "s3cret", ...over.headers },
  rawBody: Buffer.from(over.body ?? JSON.stringify({ messages: MESSAGES })),
  ...(over.method ? { method: over.method } : {}),
});

test("answers with the model text, the pinned model and the forced reply length", async () => {
  const { fetchImpl, calls } = fakeOpenRouter();
  const body = JSON.stringify({ messages: MESSAGES, model: "openai/gpt-5", max_tokens: 100000 });
  const out = await handleTutor(request({ body }), ENV, fetchImpl, newState());
  assert.equal(out.status, 200);
  assert.equal(out.body, "A canister is a smart contract.");
  const sent = JSON.parse(calls.find((c) => c.url.endsWith("/chat/completions")).init.body);
  assert.equal(sent.model, MODEL);
  assert.equal(sent.max_tokens, MAX_TOKENS);
  assert.deepEqual(Object.keys(sent).sort(), ["max_tokens", "messages", "model", "temperature"]);
});

test("is off unless TUTOR_PROXY_ENABLED is 1", async () => {
  const { fetchImpl, calls } = fakeOpenRouter();
  const out = await handleTutor(request(), { ...ENV, TUTOR_PROXY_ENABLED: "0" }, fetchImpl, newState());
  assert.equal(out.status, 503);
  assert.equal(calls.length, 0);
});

test("refuses a wrong or missing secret, a browser origin and other methods", async () => {
  const { fetchImpl, calls } = fakeOpenRouter();
  assert.equal((await handleTutor(request({ headers: { "x-tutor-secret": "nope" } }), ENV, fetchImpl, newState())).status, 401);
  assert.equal((await handleTutor({ ...request(), headers: {} }, ENV, fetchImpl, newState())).status, 401);
  assert.equal((await handleTutor(request({ headers: { origin: "https://evil.example" } }), ENV, fetchImpl, newState())).status, 403);
  assert.equal((await handleTutor(request({ method: "GET" }), ENV, fetchImpl, newState())).status, 405);
  assert.equal(calls.length, 0);
});

test("refuses bad or oversized bodies before any OpenRouter call", async () => {
  const { fetchImpl, calls } = fakeOpenRouter();
  const st = newState();
  const tooBig = JSON.stringify({ messages: [{ role: "user", content: "x".repeat(13_000) }] });
  assert.equal((await handleTutor(request({ body: tooBig }), ENV, fetchImpl, st)).status, 413);
  assert.equal((await handleTutor(request({ body: "not json" }), ENV, fetchImpl, st)).status, 400);
  const eleven = JSON.stringify({ messages: Array.from({ length: 11 }, () => ({ role: "user", content: "hi" })) });
  assert.equal((await handleTutor(request({ body: eleven }), ENV, fetchImpl, st)).status, 400);
  const badRole = JSON.stringify({ messages: [{ role: "tool", content: "hi" }] });
  assert.equal((await handleTutor(request({ body: badRole }), ENV, fetchImpl, st)).status, 400);
  assert.equal(calls.length, 0);
});

test("stops at the daily spend cap and at the monthly key cap", async () => {
  const spent = fakeOpenRouter({ usageDaily: 0.25 });
  assert.equal((await handleTutor(request(), ENV, spent.fetchImpl, newState())).status, 429);
  assert.ok(!spent.calls.some((c) => c.url.endsWith("/chat/completions")));
  const monthly = fakeOpenRouter({ limitRemaining: 0 });
  assert.equal((await handleTutor(request(), ENV, monthly.fetchImpl, newState())).status, 429);
  assert.ok(!monthly.calls.some((c) => c.url.endsWith("/chat/completions")));
});

test("stops at the daily message cap of this instance, and resets the next UTC day", async () => {
  const { fetchImpl } = fakeOpenRouter();
  const st = newState();
  const day1 = Date.parse("2026-10-30T12:00:00Z");
  for (let i = 0; i < 3; i++) assert.equal((await handleTutor(request(), ENV, fetchImpl, st, day1)).status, 200);
  assert.equal((await handleTutor(request(), ENV, fetchImpl, st, day1)).status, 429);
  assert.equal((await handleTutor(request(), ENV, fetchImpl, st, day1 + 86_400_000)).status, 200);
});

test("maps provider refusals to 429 and failures to 502", async () => {
  assert.equal((await handleTutor(request(), ENV, fakeOpenRouter({ chatStatus: 402 }).fetchImpl, newState())).status, 429);
  assert.equal((await handleTutor(request(), ENV, fakeOpenRouter({ chatStatus: 500 }).fetchImpl, newState())).status, 502);
  assert.equal((await handleTutor(request(), ENV, fakeOpenRouter({ text: "  " }).fetchImpl, newState())).status, 502);
});
