// Builds src/demo/demoData.generated.json for the browser-only demo build (`npm run build:demo`):
// the quests from main.mo and the quizzes, with their answers, from Quizzes.mo.
// The demo checks answers in the browser, so they are in its bundle. Only the demo build uses
// this file; the real build never imports it (scripts/bundle-check.mjs checks that).
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT } from "./lib.mjs";

const main = readFileSync(resolve(ROOT, "backend/src/backend/main.mo"), "utf8");
const quests = [...main.matchAll(/\{ id = (\d+); title = "([^"]*)"; description = "([^"]*)"; link = "([^"]*)"; rewardAmount = (\d+); prerequisite = (null|\?\d+); category = "([^"]*)"; \}/g)].map(
  ([, id, title, description, link, reward, pre, category]) => ({
    id: Number(id), title, description, link, rewardAmount: Number(reward),
    prerequisite: pre === "null" ? null : Number(pre.slice(1)), category,
  }),
);

const src = readFileSync(resolve(ROOT, "backend/src/backend/Quizzes.mo"), "utf8");
const quizzes = {};
for (const block of src.split("{ questId = ").slice(1)) {
  const id = Number(block.match(/^\d+/)[0]);
  quizzes[id] = [...block.matchAll(/\{ text = "((?:[^"\\]|\\.)*)"; options = \[(.*?)\]; answer = (\d+) \}/g)].map((m) => ({
    text: JSON.parse(`"${m[1]}"`),
    options: [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((o) => JSON.parse(`"${o[1]}"`)),
    answer: Number(m[3]),
  }));
}

if (quests.length !== 12 || Object.keys(quizzes).length !== 12 || Object.values(quizzes).some((q) => q.length !== 3)) {
  throw new Error(`Expected 12 quests and 12 quizzes of 3 questions, found ${quests.length} and ${Object.keys(quizzes).length}`);
}
const out = resolve(ROOT, "frontend/src/demo/demoData.generated.json");
writeFileSync(out, JSON.stringify({ quests, quizzes }, null, 1) + "\n");
console.log(`wrote ${out}: ${quests.length} quests, ${Object.keys(quizzes).length} quizzes`);
