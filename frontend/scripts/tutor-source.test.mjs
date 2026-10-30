// The tutor must never be able to read quiz data. This test fails if Tutor.mo, or any module it
// imports, imports Quizzes, or if the tutor section of main.mo touches the quiz bank.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND = resolve(dirname(fileURLToPath(import.meta.url)), "../../backend/src/backend");

// Local module imports of a Motoko file ("mo:" packages and "canister:" aliases are not files)
function localImports(file) {
  const src = readFileSync(file, "utf8");
  return [...src.matchAll(/^\s*import\s+\w+\s+"([^"]+)"/gm)]
    .map((m) => m[1])
    .filter((p) => !p.includes(":"))
    .map((p) => resolve(dirname(file), `${p}.mo`));
}

test("Tutor.mo cannot reach Quizzes through its imports", () => {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    assert.ok(existsSync(file), `missing module ${file}`);
    for (const dep of localImports(file)) {
      assert.notEqual(dep.toLowerCase(), resolve(BACKEND, "Quizzes.mo").toLowerCase(), `${file} imports Quizzes`);
      visit(dep);
    }
  };
  visit(resolve(BACKEND, "Tutor.mo"));
});

test("the tutor section of main.mo does not touch the quiz bank", () => {
  const src = readFileSync(resolve(BACKEND, "main.mo"), "utf8");
  const start = src.indexOf("// ---- Tutor ----");
  const end = src.indexOf("public query func getQuestCount");
  assert.ok(start > 0 && end > start, "tutor section markers not found");
  const section = src.slice(start, end);
  for (const word of ["Quizzes", "findQuiz", "getQuiz", ".questions", ".answer"]) {
    assert.ok(!section.includes(word), `the tutor section uses ${word}`);
  }
});
