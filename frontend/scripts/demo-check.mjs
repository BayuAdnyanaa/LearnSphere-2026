// Checks the browser-only demo build through the real UI. Serve it first:
//   npm run build:demo && npx vite preview --mode demo --outDir dist-demo --port 4173
//   node scripts/demo-check.mjs [url]
// It saves demo-*.png screenshots to docs/design/screens-v2/ (gitignored).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, play, readAnswers } from "./lib.mjs";

const URL = process.argv[2] ?? "http://localhost:4173";
const OUT = resolve(ROOT, "docs/design/screens-v2");
mkdirSync(OUT, { recursive: true });
const answers = readAnswers();
const failures = [];
const check = (ok, text) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${text}`);
  if (!ok) failures.push(text);
};
const lit = (page, n) => page.getByRole("heading", { name: `${n} of 12 stars lit` }).first().waitFor({ timeout: 10000 });

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(URL);
  await page.getByRole("button", { name: "Start the demo" }).waitFor();
  await page.screenshot({ path: resolve(OUT, "demo-welcome-1440.png") });
  await page.getByRole("button", { name: "Start the demo" }).click();
  await lit(page, 0);
  check(await page.getByRole("complementary", { name: "Demo mode" }).isVisible(), "the demo banner shows on the map");

  for (const id of [1, 3, 7]) await play(page, id, answers, true);
  await lit(page, 3);
  await play(page, 8, answers, false);
  await page.reload();
  await lit(page, 3);
  check(true, "a reload keeps 3 lit stars");
  await page.locator('[data-star="8"]').click();
  check(await page.locator("dialog[open]").getByText(/\d+:\d\d/).first().isVisible(), "the cooldown survives the reload");
  await page.locator("dialog[open]").getByRole("button", { name: "Close" }).click();
  await page.mouse.move(700, 120);
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(OUT, "demo-map-1440.png") });

  await page.getByRole("button", { name: "Ask the AI tutor" }).click();
  const panel = page.getByRole("dialog", { name: "AI tutor" });
  await panel.getByRole("textbox").fill("What is a principal?");
  await panel.getByRole("button", { name: "Send" }).click();
  const reply = await panel.locator('[data-sender="tutor"]').last().textContent({ timeout: 5000 });
  check(reply.includes("Demo mode: the AI tutor answers only in the full version"), `the tutor says it is the demo: "${reply.slice(0, 80)}..."`);
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: resolve(OUT, "demo-map-390.png") });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Start over" }).click();
  await page.getByRole("button", { name: "Log out" }).or(page.getByRole("button", { name: "Start the demo" })).first().waitFor();
  if (await page.getByRole("button", { name: "Start the demo" }).isVisible()) await page.getByRole("button", { name: "Start the demo" }).click();
  await lit(page, 0);
  check(true, "Start over resets the progress to 0 lit stars");

  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("button", { name: "Start the demo" }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Start the demo" }).waitFor();
  check(true, "Log out returns to the welcome screen, also after a reload");
  check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join("; ")}` : ""}`);
} catch (err) {
  failures.push(err.message);
  console.error(err);
} finally {
  await browser.close();
}
console.log(failures.length ? `demo check FAILED: ${failures.length} problem(s)` : "demo check passed");
process.exit(failures.length ? 1 : 0);
