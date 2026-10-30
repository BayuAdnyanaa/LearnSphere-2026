// Checks the Internet Identity login flow of @icp-sdk/auth against the local II, through the
// real UI. Needs the local network and the Vite dev server (see the README, "Run it locally").
//   1. a fresh identity logs in, and a reload keeps the session
//   2. a failed quiz shows the countdown, and the quiz passes after the wait
//   3. logging out ends the session, also after a reload
//   4. a second fresh identity gets another principal
//   node scripts/login-check.mjs
import { chromium } from "playwright";
import { APP, login, play, readAnswers } from "./lib.mjs";

const answers = readAnswers();
const browser = await chromium.launch();
const failures = [];
const check = (ok, text) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${text}`);
  if (!ok) failures.push(text);
};

// A new browser context per user, so no session is shared; the app logs the principal
async function freshUser(name) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const principals = [];
  page.on("console", (m) => {
    const p = m.text().match(/User Principal: (\S+)/);
    if (p) principals.push(p[1]);
  });
  await page.goto(APP);
  await login(page, name);
  return { context, page, principals };
}

try {
  const a = await freshUser("PW login A");
  check(a.principals.length > 0, `user A logged in as ${a.principals.at(-1)}`);

  await a.page.reload();
  await a.page.locator("[data-star]").first().waitFor({ timeout: 30000 });
  check(a.principals.at(-1) === a.principals[0], "a reload keeps the session and the principal");

  await play(a.page, 7, answers, false);
  console.log("waiting 65 s for the first cooldown to end");
  await a.page.waitForTimeout(65_000);
  await play(a.page, 7, answers, true);
  await a.page.getByRole("heading", { name: "1 of 12 stars lit" }).first().waitFor();
  check(true, "fail, countdown, then pass on quest 7");

  await a.page.getByRole("button", { name: "Log out" }).click();
  const loginButton = a.page.getByRole("button", { name: /Log in with Internet Identity/ });
  await loginButton.waitFor({ timeout: 10000 });
  await a.page.reload();
  await loginButton.waitFor({ timeout: 10000 });
  check(await a.page.locator("[data-star]").count() === 0, "logging out ends the session, also after a reload");

  const b = await freshUser("PW login B");
  check(b.principals.length > 0 && b.principals[0] !== a.principals[0], `user B has another principal (${b.principals[0]})`);
  await a.context.close();
  await b.context.close();
} catch (err) {
  failures.push(err.message);
  console.error(err);
} finally {
  await browser.close();
}
console.log(failures.length ? `login check FAILED: ${failures.length} problem(s)` : "login check passed");
process.exit(failures.length ? 1 : 0);
