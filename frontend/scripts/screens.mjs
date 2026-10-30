// Plays quests through the real UI and canister on a fresh local Internet Identity,
// then saves star map screenshots at 1440x900 and 390x844.
//
//   node scripts/screens.mjs [sample|complete|all]
//
// sample:   the welcome screen; pass 1, 3 and 7 and fail 8 (the hand-off sample state, shot
//           during the cooldown); the quest detail, quiz, both results, the tutor and the
//           phone sheet; then the regression: wait out the cooldown on quest 8 and pass it
// complete: pass all 12 quests
// Needs the local network, the deployed canisters and `npm run dev` on port 5173.
// The quiz answers come from backend/src/backend/Quizzes.mo, where they are public.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { APP, PATH_ORDER, ROOT, login, play as playQuest, readAnswers } from "./lib.mjs";

const OUT = resolve(ROOT, "docs/design/screens-v2");

// Play a quest; shots names the { detail, quiz, result } screenshots to take on the way
const play = (page, id, answers, pass, shots = {}) =>
  playQuest(page, id, answers, pass, Object.fromEntries(Object.entries(shots).map(([k, name]) => [k, () => both(page, name)])));

// The current screen at desktop and phone width, as it is (no scrolling)
async function both(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(OUT, `${name}-1440.png`) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: resolve(OUT, `${name}-390.png`) });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);
  console.log(`saved ${name}-1440.png, ${name}-390.png`);
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

// The phone sheet unfolded, and the tutor panel open (UI only: nothing is sent)
async function sheetAndTutor(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Show more about the suggested quest" }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(OUT, "map-sample-390-sheet-open.png") });
  console.log("saved map-sample-390-sheet-open.png");
  await page.getByRole("button", { name: "Show less about the suggested quest" }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Ask the AI tutor" }).click();
  await page.getByRole("dialog", { name: "AI tutor" }).waitFor();
  await both(page, "tutor-open");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "AI tutor" }).waitFor({ state: "detached" });
}

// Fail, countdown, pass on a real quest: wait out the first cooldown (60 s) on quest 8
async function regression(page, answers, failedAt) {
  await page.locator('[data-star="8"]').click();
  const dialog = page.locator("dialog[open]");
  const clockText = await dialog.getByText(/\d+:\d\d/).first().textContent();
  console.log(`regression: quest 8 detail shows the countdown "${clockText.trim()}"`);
  await dialog.getByRole("button", { name: "Close" }).click();
  const left = 62000 - (Date.now() - failedAt);
  if (left > 0) await page.waitForTimeout(left);
  await play(page, 8, answers, true);
  await page.getByRole("heading", { name: "4 of 12 stars lit" }).first().waitFor({ timeout: 30000 });
  console.log(`regression: quest 8 passed ${Math.round((Date.now() - failedAt) / 1000)} s after the failed try`);
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
    await play(page, 1, answers, true);
    await play(page, 3, answers, true, { detail: "quest-detail", quiz: "quiz", result: "result-passed" });
    await play(page, 7, answers, true);
    await play(page, 8, answers, false, { result: "result-not-passed" });
    const failedAt = Date.now();
    await shoot(page, "map-sample", 3);
    await sheetAndTutor(page);
    await regression(page, answers, failedAt);
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
