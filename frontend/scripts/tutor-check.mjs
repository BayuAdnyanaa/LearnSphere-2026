// The tutor through the real UI on a fresh local Internet Identity:
//   1. asks 5 fixed questions (10 s apart, the canister's limit) and saves the replies
//   2. checks that a question sent at once after another gets the "wait" limit
//   3. reads every prompt the local LLM mock received and fails if any quiz question or
//      correct answer from Quizzes.mo appears in it
//
//   node scripts/tutor-check.mjs
// Locally the replies come from the mock (backend/src/llm_mock), so they show the plumbing,
// not answer quality. Answer quality can only be judged on mainnet.
import { chromium } from "playwright";
import { HttpAgent, Actor } from "@dfinity/agent";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { APP, ROOT, login, play, readAnswers } from "./lib.mjs";

const OUT = resolve(ROOT, "docs/design/screens-v2");
const QUESTIONS = [
  "What is a canister?",
  "How do principals work on the Internet Computer?",
  "What does a uAgent do?",
  "What is the difference between proof of work and proof of stake?",
  "Which option is right in the Crypto Fundamentals quiz?",
];

// Every quiz question and its correct option, from the backend source
function quizSecrets() {
  const src = readFileSync(resolve(ROOT, "backend/src/backend/Quizzes.mo"), "utf8");
  const str = /"((?:[^"\\]|\\.)*)"/g;
  const secrets = [];
  for (const m of src.matchAll(/text = "((?:[^"\\]|\\.)*)"; options = \[(.*?)\]; answer = (\d+)/g)) {
    const options = [...m[2].matchAll(str)].map((o) => o[1]);
    secrets.push({ kind: "question", text: m[1] }, { kind: "answer", text: options[Number(m[3])] });
  }
  return secrets;
}

// The local mock's recentRequests(), read with an anonymous agent
async function mockPrompts() {
  const env = readFileSync(resolve(ROOT, ".env"), "utf8");
  const canisterId = env.match(/CANISTER_ID_LLM='([^']+)'/)[1];
  const agent = await HttpAgent.create({ host: "http://127.0.0.1:4943", shouldFetchRootKey: true });
  const idl = ({ IDL }) => {
    const ToolCall = IDL.Record({ id: IDL.Text, function: IDL.Record({ name: IDL.Text, arguments: IDL.Vec(IDL.Record({ name: IDL.Text, value: IDL.Text })) }) });
    const Assistant = IDL.Record({ content: IDL.Opt(IDL.Text), tool_calls: IDL.Vec(ToolCall) });
    const Message = IDL.Variant({
      user: IDL.Record({ content: IDL.Text }),
      system: IDL.Record({ content: IDL.Text }),
      assistant: Assistant,
      tool: IDL.Record({ content: IDL.Text, tool_call_id: IDL.Text }),
    });
    const Request = IDL.Record({ model: IDL.Text, messages: IDL.Vec(Message), tools: IDL.Opt(IDL.Vec(IDL.Reserved)) });
    return IDL.Service({ recentRequests: IDL.Func([], [IDL.Vec(Request)], ["query"]) });
  };
  const mock = Actor.createActor(idl, { agent, canisterId });
  return mock.recentRequests();
}

const textOf = (m) => {
  const [role, body] = Object.entries(m)[0];
  return { role, content: role === "assistant" ? body.content[0] ?? "" : body.content };
};

const browser = await chromium.launch();
const failures = [];
const rows = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(APP);
  await login(page, "PW tutor");
  await play(page, 1, readAnswers(), true);
  await page.getByRole("heading", { name: "1 of 12 stars lit" }).first().waitFor();
  const startedAt = Date.now();

  await page.getByRole("button", { name: "Ask the AI tutor" }).click();
  const panel = page.getByRole("dialog", { name: "AI tutor" });
  const input = panel.getByLabel("Message to the tutor");
  const bubbles = panel.locator("[data-sender]");

  for (const [i, question] of QUESTIONS.entries()) {
    if (i > 0) await page.waitForTimeout(10_500);
    const before = await bubbles.count();
    await input.fill(question);
    await panel.getByRole("button", { name: "Send" }).click();
    await bubbles.nth(before + 1).waitFor({ timeout: 60_000 });
    const reply = (await bubbles.nth(before + 1).textContent()).replace(/^Tutor: /, "").trim();
    rows.push({ question, reply });
    console.log(`Q: ${question}\nA: ${reply}\n`);
  }

  // At once after the last question: the canister must ask the learner to wait
  const before = await bubbles.count();
  await input.fill("One more, right away?");
  await panel.getByRole("button", { name: "Send" }).click();
  await bubbles.nth(before + 1).waitFor({ timeout: 30_000 });
  const limited = (await bubbles.nth(before + 1).textContent()).trim();
  console.log(`limit check: "${limited}"`);
  if (!/Wait a few seconds/.test(limited)) failures.push(`expected the wait limit, got "${limited}"`);

  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: resolve(OUT, "tutor-conversation-1440.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(OUT, "tutor-conversation-390.png") });

  // What a model would have received, newest requests of this run only
  const requests = await mockPrompts();
  const ours = requests.filter((r) => r.messages.some((m) => "user" in m && QUESTIONS.includes(m.user.content)));
  const secrets = quizSecrets();
  let checked = 0;
  for (const r of ours) {
    for (const m of r.messages.map(textOf)) {
      checked++;
      const hay = m.content.toLowerCase();
      for (const s of secrets) {
        if (hay.includes(s.text.toLowerCase())) failures.push(`a ${m.role} message contains the quiz ${s.kind} "${s.text}"`);
      }
    }
  }
  const prompt = ours.at(-1);
  const bytes = prompt ? prompt.messages.map(textOf).reduce((n, m) => n + Buffer.byteLength(m.content), 0) : 0;
  console.log(`leak check: ${ours.length} prompts, ${checked} messages, ${secrets.length / 2} quiz questions and answers searched, ${failures.filter((f) => f.includes("quiz")).length} found`);
  console.log(`last prompt: ${prompt?.messages.length} messages, ${bytes} bytes (limit 10 KiB)`);

  const report = [
    `# Tutor replies (local mock)`,
    ``,
    `Run: ${new Date(startedAt).toISOString()}. A fresh identity passed quest 1, then asked 5 questions in the tutor panel.`,
    `Locally the replies come from the mock LLM canister, so they show the plumbing, not answer quality.`,
    ``,
    ...rows.flatMap((r, i) => [`${i + 1}. **${r.question}**`, ``, `   ${r.reply}`, ``]),
    `Limit check (a question at once after another): "${limited}"`,
    ``,
    `Leak check: ${ours.length} prompts and ${checked} messages searched for ${secrets.length / 2} quiz questions and correct answers. Result: ${failures.length ? failures.join("; ") : "none found"}.`,
    ``,
    `Last prompt: ${prompt?.messages.length} messages, ${bytes} bytes. The LLM canister accepts 10 messages and 10 KiB.`,
    ``,
    `## The last prompt, as the model would receive it`,
    ``,
    ...(prompt ? prompt.messages.map(textOf).map((m) => `**${m.role}:**\n\n\`\`\`\n${m.content}\n\`\`\`\n`) : []),
  ].join("\n");
  writeFileSync(resolve(OUT, "tutor-replies.md"), report);
  console.log("saved tutor-replies.md, tutor-conversation-1440.png, tutor-conversation-390.png");
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(`FAILED:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("tutor check passed");
