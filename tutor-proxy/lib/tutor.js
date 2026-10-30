// The tutor fallback proxy: the backend canister posts the tutor messages here through one
// HTTPS outcall, and this code asks OpenRouter. The canister's shared secret sits in canister
// memory, where node operators could read it, so this code trusts nothing from the caller:
// it applies its own caps, pins the model and the reply length, and refuses browser calls.
// The OpenRouter key's own monthly spending cap is the hard backstop.
import { timingSafeEqual } from "node:crypto";

export const MODEL = "anthropic/claude-haiku-5.5";
export const MAX_TOKENS = 400;
export const MAX_BODY_BYTES = 12_288;
export const MAX_MESSAGES = 10;
export const MAX_CONTENT_CHARS = 10_000;
const ROLES = new Set(["system", "user", "assistant"]);
const KEY_INFO_TTL_MS = 60_000;

// Per-instance state: today's message count and the cached key usage
export function newState() {
  return { day: "", count: 0, keyInfo: null, keyInfoAt: 0 };
}

const reply = (status, text) => ({ status, headers: { "content-type": "text/plain; charset=utf-8" }, body: text });

function sameSecret(given, expected) {
  if (typeof given !== "string" || !expected) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Today's spend on this key, from OpenRouter, cached for a minute
async function keyUsage(env, fetchImpl, state, now) {
  if (!state.keyInfo || now - state.keyInfoAt > KEY_INFO_TTL_MS) {
    const res = await fetchImpl("https://openrouter.ai/api/v1/key", { headers: { authorization: `Bearer ${env.OPENROUTER_API_KEY}` } });
    if (!res.ok) throw new Error(`key info status ${res.status}`);
    state.keyInfo = (await res.json()).data;
    state.keyInfoAt = now;
  }
  return state.keyInfo;
}

/**
 * request: { method, headers (lower-case names), rawBody (Buffer or string) }
 * env: OPENROUTER_API_KEY, TUTOR_SECRET, TUTOR_PROXY_ENABLED ("1" to answer),
 *      DAILY_USD_CAP (default 0.25), DAILY_MESSAGE_CAP (default 1000, per instance)
 * Returns { status, headers, body }.
 */
export async function handleTutor(request, env, fetchImpl, state, now = Date.now()) {
  if (env.TUTOR_PROXY_ENABLED !== "1") return reply(503, "The tutor fallback is switched off.");
  if (request.method !== "POST") return reply(405, "Use POST.");
  // The canister's outcall sends no Origin header; a browser always does
  if (request.headers.origin) return reply(403, "Browsers may not call this proxy.");
  if (!sameSecret(request.headers["x-tutor-secret"], env.TUTOR_SECRET)) return reply(401, "Wrong secret.");
  const size = Buffer.byteLength(request.rawBody ?? "");
  if (size === 0 || size > MAX_BODY_BYTES) return reply(413, "The request body is empty or too large.");

  let messages;
  try {
    messages = JSON.parse(request.rawBody.toString()).messages;
  } catch {
    return reply(400, "The body is not JSON.");
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return reply(400, "Send 1 to 10 messages.");
  let chars = 0;
  for (const m of messages) {
    if (!m || !ROLES.has(m.role) || typeof m.content !== "string") return reply(400, "Each message needs a role and a text content.");
    chars += m.content.length;
  }
  if (chars > MAX_CONTENT_CHARS) return reply(413, "The messages are too long.");

  // Daily caps: a message count in this instance, and today's spend on the whole key
  const day = new Date(now).toISOString().slice(0, 10);
  if (state.day !== day) Object.assign(state, { day, count: 0 });
  if (state.count >= Number(env.DAILY_MESSAGE_CAP ?? 1000)) return reply(429, "Today's message limit is reached.");
  let usage;
  try {
    usage = await keyUsage(env, fetchImpl, state, now);
  } catch {
    return reply(502, "Cannot read the key usage, so no answer is given.");
  }
  if (Number(usage.usage_daily ?? 0) >= Number(env.DAILY_USD_CAP ?? 0.25)) return reply(429, "Today's spending limit is reached.");
  if (usage.limit_remaining !== null && usage.limit_remaining !== undefined && Number(usage.limit_remaining) <= 0) {
    return reply(429, "This month's spending limit is reached.");
  }
  state.count++;

  // Only the checked roles and texts go on; the model and the reply length are fixed here
  const res = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  });
  if (res.status === 402 || res.status === 429) return reply(429, "The model provider refused: a limit is reached.");
  if (!res.ok) return reply(502, `The model provider failed with status ${res.status}.`);
  const text = (await res.json()).choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) return reply(502, "The model gave no answer.");
  return reply(200, text.trim());
}
