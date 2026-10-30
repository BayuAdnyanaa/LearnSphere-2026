// Runs the proxy rules on http://0.0.0.0:8787/api/tutor with a fake OpenRouter, so the
// canister's HTTPS outcall can be tested locally without a key and without spending money.
//
//   node scripts/local-server.mjs
// Then, as a controller, point the local canister at it:
//   dfx canister call learnsphere_backend setTutorProxy '("http://<host>:8787/api/tutor", "local-secret")'
//   dfx canister call learnsphere_backend setTutorMode '(variant { proxy })'
import { createServer } from "node:http";
import { handleTutor, newState } from "../lib/tutor.js";

const ENV = { TUTOR_PROXY_ENABLED: "1", TUTOR_SECRET: "local-secret", OPENROUTER_API_KEY: "fake", DAILY_USD_CAP: "0.25", DAILY_MESSAGE_CAP: "1000" };
const state = newState();
let last = null;

// Answers like OpenRouter would, and keeps the last chat request for inspection
async function fakeOpenRouter(url, init = {}) {
  if (url.endsWith("/api/v1/key")) return { ok: true, status: 200, json: async () => ({ data: { usage_daily: 0, limit_remaining: 5 } }) };
  last = JSON.parse(init.body);
  const question = last.messages.at(-1).content;
  return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: `[Local fake OpenRouter, model ${last.model}] You asked: ${question}` } }] }) };
}

createServer(async (req, res) => {
  if (req.url === "/last") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(last));
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const out = await handleTutor({ method: req.method, headers: req.headers, rawBody: Buffer.concat(chunks) }, ENV, fakeOpenRouter, state);
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} -> ${out.status}`);
  res.writeHead(out.status, out.headers);
  res.end(out.body);
}).listen(8787, "0.0.0.0", () => console.log("local proxy on :8787"));
