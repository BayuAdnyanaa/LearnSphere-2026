// Fails if a build folder contains any quiz question or correct answer from Quizzes.mo.
// The real build must never contain them; the demo build must (it checks answers itself).
//   node scripts/bundle-check.mjs            checks dist/ (expects none)
//   node scripts/bundle-check.mjs dist-demo  checks the demo build (expects all)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT } from "./lib.mjs";

const dir = resolve(ROOT, "frontend", process.argv[2] ?? "dist");
const demo = dir.endsWith("dist-demo");

const secrets = [];
const src = readFileSync(resolve(ROOT, "backend/src/backend/Quizzes.mo"), "utf8");
for (const m of src.matchAll(/text = "((?:[^"\\]|\\.)*)"; options = \[(.*?)\]; answer = (\d+)/g)) {
  const options = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((o) => JSON.parse(`"${o[1]}"`));
  secrets.push(JSON.parse(`"${m[1]}"`), options[Number(m[3])]);
}

const files = [];
const walk = (d) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : files.push(join(d, f))));
walk(dir);
const text = files.filter((f) => /\.(js|html|json|css|map)$/.test(f)).map((f) => readFileSync(f, "utf8")).join("\n");
const found = secrets.filter((s) => text.includes(s) || text.includes(JSON.stringify(s).slice(1, -1)));

console.log(`${dir}: ${files.length} files, ${found.length} of ${secrets.length} quiz questions and answers found`);
const ok = demo ? found.length === secrets.length : found.length === 0;
console.log(ok ? "bundle check passed" : `bundle check FAILED (expected ${demo ? "all" : "none"})`);
process.exit(ok ? 0 : 1);
