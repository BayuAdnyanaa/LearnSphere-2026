// Plays quests through the real UI and canister on a fresh local Internet Identity,
// then saves star map screenshots at 1440x900 and 390x844.
//
//   node scripts/screens.mjs [sample|complete|all]
//
// sample:   the welcome screen, then pass 1, 3 and 7 and fail 8 (the hand-off sample
//           state, shot during the cooldown)
// complete: pass all 12 quests
// Needs the local network, the deployed canisters and `npm run dev` on port 5173.
// The quiz answers come from backend/src/backend/Quizzes.mo, where they are public.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = resolve(ROOT, "docs/design/screens-v2");
const APP = "http://localhost:5173";
const PATH_ORDER = [1, 3, 5, 12, 2, 4, 6, 7, 8, 9, 10, 11];

// questId -> [answer index per question]
function readAnswers() {
  const src = readFileSync(resolve(ROOT, "backend/src/backend/Quizzes.mo"), "utf8");
  const answers = {};
  for (const block of src.split("questId = ").slice(1)) {
    const id = Number(block.match(/^\d+/)[0]);
    answers[id] = [...block.matchAll(/answer = (\d+)/g)].map((m) => Number(m[1]));
  }
  return answers;
}

async function login(page, name) {
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

async function play(page, id, answers, pass) {
  await page.locator(`[data-star="${id}"]`).click();
  const dialog = page.locator("dialog[open]");
  // The link opens the source page in a new tab; close it again
  const [tab] = await Promise.all([page.context().waitForEvent("page"), dialog.getByRole("link", { name: /Read this page/ }).click()]);
  await tab.close();
  await dialog.getByRole("button", { name: "Start quiz" }).click();
  const picks = answers[id].map((a) => (pass ? a : (a + 1) % 4));
  for (const [qi, a] of picks.entries()) {
    await dialog.locator(`input[name="ls-q${qi}"]`).nth(a).check({ force: true });
  }
  await dialog.getByRole("button", { name: "Submit answers" }).click();
  const heading = await dialog.getByRole("heading", { name: /^(Passed|Not passed)$/ }).textContent({ timeout: 30000 });
  if ((heading === "Passed") !== pass) throw new Error(`Quest ${id}: expected ${pass ? "Passed" : "Not passed"}, got ${heading}`);
  console.log(`quest ${id}: ${heading}`);
  await dialog.getByRole("button", { name: "Back to the sky" }).click();
}

async function shoot(page, name, lit) {
  // The map reloads quietly after a result; wait until it shows the new count
  if (lit !== null) await page.getByRole("heading", { name: `${lit} of 12 stars lit` }).first().waitFor({ timeout: 30000 });
  await page.mouse.move(720, 60);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(OUT, `${name}-1440.png`) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(OUT, `${name}-390.png`) });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(OUT, `${name}-390-bottom.png`) });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewportSize({ width: 1440, height: 900 });
  console.log(`saved ${name}-1440.png, ${name}-390.png, ${name}-390-bottom.png`);
}

async function run(browser, mode, answers) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(APP);
  if (mode === "sample") {
    await page.getByRole("button", { name: /Log in with Internet Identity/ }).waitFor();
    await shoot(page, "welcome", null);
  }
  await login(page, `PW ${mode}`);
  if (mode === "sample") {
    for (const id of [1, 3, 7]) await play(page, id, answers, true);
    await play(page, 8, answers, false);
    await shoot(page, "map-sample", 3);
  } else {
    for (const id of PATH_ORDER) await play(page, id, answers, true);
    await shoot(page, "map-complete", 12);
  }
  await context.close();
}

const mode = process.argv[2] ?? "all";
mkdirSync(OUT, { recursive: true });
const answers = readAnswers();
const browser = await chromium.launch();
try {
  for (const m of mode === "all" ? ["sample", "complete"] : [mode]) await run(browser, m, answers);
} finally {
  await browser.close();
}
