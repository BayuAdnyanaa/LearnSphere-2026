// Blind comparison of the two fallback models for Bayu. Do not run it before Bayu approves the
// money: it spends real OpenRouter credits (about $0.01 for 40 replies).
//
//   OPENROUTER_API_KEY=... node scripts/blind-test.mjs --approved-by-bayu
//
// Each of the 20 questions in blind-test/questions.json goes to both models with the tutor's
// real system prompt (read from backend/src/backend/Tutor.mo) and a fixed sample learner.
// blind-test/out/replies-for-bayu.md shows each pair as A and B in a random order;
// blind-test/out/key.json says which model wrote which. Bayu judges before opening the key.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomInt } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const OUT = resolve(HERE, "../blind-test/out");
const MODELS = ["anthropic/claude-haiku-5.5", "google/gemini-2.5-flash-lite"];

if (!process.argv.includes("--approved-by-bayu")) {
  console.error("This spends real OpenRouter credits. Run it only after Bayu approves, with --approved-by-bayu.");
  process.exit(1);
}
const key = process.env.OPENROUTER_API_KEY;
if (!key) {
  console.error("Set OPENROUTER_API_KEY first.");
  process.exit(1);
}

// The tutor's system prompt, joined from the string pieces of systemPrompt() in Tutor.mo
function systemPrompt() {
  const src = readFileSync(resolve(ROOT, "backend/src/backend/Tutor.mo"), "utf8");
  const start = src.indexOf("public func systemPrompt()");
  const body = src.slice(start, src.indexOf("};", start));
  return [...body.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`)).join("");
}

// The hand-off sample learner: quests 1, 3 and 7 done, 5 suggested
const CONTEXT = `Learner context.
Suggested next quest:
- Understanding Principals (Internet Computer): Learn about identity on the IC. Reading page: https://docs.internetcomputer.org/concepts/principals/
Open quests:
- Introduction to Fetch.ai (AI Agents): Read the official introduction to Fetch.ai and uAgents. Reading page: https://innovationlab.fetch.ai/resources/docs/intro
- Understanding Principals (Internet Computer): Learn about identity on the IC. Reading page: https://docs.internetcomputer.org/concepts/principals/
- Crypto Fundamentals (Web3): Learn the basics of what cryptocurrency is and how it works. Reading page: https://www.nerdwallet.com/investing/learn/cryptocurrency
Completed quests:
- What is a Canister? (Internet Computer): Read the introductory article on ICP smart contracts. Reading page: https://docs.internetcomputer.org/concepts/canisters/
- Building Your First dApp (Internet Computer): Follow the ICP quickstart to create and deploy your first app. Reading page: https://docs.internetcomputer.org/getting-started/quickstart/
- What is Web3? (Web3): Get a high-level overview of the next evolution of the internet. Reading page: https://ethereum.org/web3/`;

async function ask(model, question) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      temperature: 0.3,
      messages: [{ role: "system", content: `${systemPrompt()}\n\n${CONTEXT}` }, { role: "user", content: question }],
    }),
  });
  if (!res.ok) throw new Error(`${model}: status ${res.status}`);
  return (await res.json()).choices[0].message.content.trim();
}

const questions = JSON.parse(readFileSync(resolve(HERE, "../blind-test/questions.json"), "utf8"));
const lines = ["# Tutor blind test", "", "For each question, mark the better answer: A, B or same. Open key.json only after you finish.", ""];
const keyMap = [];
for (const [i, q] of questions.entries()) {
  const order = randomInt(2) ? [...MODELS] : [...MODELS].reverse();
  const [a, b] = await Promise.all(order.map((m) => ask(m, q)));
  keyMap.push({ question: i + 1, A: order[0], B: order[1] });
  lines.push(`## ${i + 1}. ${q}`, "", "**A:**", "", a, "", "**B:**", "", b, "", "Better: ___", "");
  console.log(`${i + 1}/${questions.length} done`);
}
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, "replies-for-bayu.md"), lines.join("\n"));
writeFileSync(resolve(OUT, "key.json"), JSON.stringify(keyMap, null, 2));
console.log(`saved ${resolve(OUT, "replies-for-bayu.md")} and key.json`);
