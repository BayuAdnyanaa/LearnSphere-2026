// Shared helpers for the Playwright scripts: a fresh local Internet Identity login, and
// playing one quest through the real UI. The quiz answers come from Quizzes.mo.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const APP = "http://localhost:5173";
export const PATH_ORDER = [1, 3, 5, 12, 2, 4, 6, 7, 8, 9, 10, 11];

// questId -> [answer index per question]
export function readAnswers() {
  const src = readFileSync(resolve(ROOT, "backend/src/backend/Quizzes.mo"), "utf8");
  const answers = {};
  for (const block of src.split("questId = ").slice(1)) {
    const id = Number(block.match(/^\d+/)[0]);
    answers[id] = [...block.matchAll(/answer = (\d+)/g)].map((m) => Number(m[1]));
  }
  return answers;
}

export async function login(page, name) {
  const [ii] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("button", { name: /Log in with Internet Identity/ }).click(),
  ]);
  await ii.getByRole("button", { name: "Continue with passkey" }).click();
  await ii.getByRole("button", { name: "Create new identity" }).click();
  await ii.getByLabel("Identity name").or(ii.getByPlaceholder("Identity name")).first().fill(name);
  await ii.getByRole("button", { name: "Create identity" }).click();
  await ii.getByRole("button", { name: "Continue", exact: true }).click();
  await ii.waitForEvent("close", { timeout: 30000 });
  await page.locator("[data-star]").first().waitFor({ timeout: 30000 });
}

// at: optional { detail, quiz, result } callbacks, run at those steps (for screenshots)
export async function play(page, id, answers, pass, at = {}) {
  await page.locator(`[data-star="${id}"]`).click();
  const dialog = page.locator("dialog[open]");
  if (at.detail) await at.detail();
  // The link opens the source page in a new tab; close it again
  const [tab] = await Promise.all([page.context().waitForEvent("page"), dialog.getByRole("link", { name: /Read this page/ }).click()]);
  await tab.close();
  await dialog.getByRole("button", { name: "Start quiz" }).click();
  const picks = answers[id].map((a) => (pass ? a : (a + 1) % 4));
  for (const [qi, a] of picks.entries()) {
    await dialog.locator(`input[name="ls-q${qi}"]`).nth(a).check({ force: true });
  }
  if (at.quiz) await at.quiz();
  await dialog.getByRole("button", { name: "Submit answers" }).click();
  const heading = await dialog.getByRole("heading", { name: /^(Passed|Not passed)$/ }).textContent({ timeout: 30000 });
  if ((heading === "Passed") !== pass) throw new Error(`Quest ${id}: expected ${pass ? "Passed" : "Not passed"}, got ${heading}`);
  if (!pass) {
    // The first failed try must show the live countdown, never "try again now"
    const wait = await dialog.getByText(/Try again in \d+:\d\d/).textContent({ timeout: 2000 });
    console.log(`quest ${id}: ${heading}, "${wait.trim()}"`);
  } else console.log(`quest ${id}: ${heading}`);
  if (at.result) await at.result();
  await dialog.getByRole("button", { name: "Back to the sky" }).click();
}
