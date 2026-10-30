// Records the demo video through the real UI on a fresh local Internet Identity, then cuts it
// with ffmpeg: the waits and the off-camera quests are left out.
//   node scripts/demo.mjs
// Needs the local network, `npm run dev` on port 5173 and ffmpeg on the PATH.
// Writes docs/demo/learnsphere-demo.mp4, learnsphere-ignite-loop.mp4 and three WebP stills.
// The raw recordings go to docs/demo/raw/, which git ignores.
// The tutor is shown only opening and closing: locally a mock answers, not a real model.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { APP, PATH_ORDER, ROOT, login, play, readAnswers } from "./lib.mjs";

const OUT = resolve(ROOT, "docs/demo");
const RAW = resolve(OUT, "raw");
const SIZE = { width: 1440, height: 900 };
rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });

// A visible cursor: headless recordings do not show the mouse
const CURSOR = `
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.style.cssText = "position:fixed;z-index:2147483647;left:-40px;top:-40px;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 0 0 2px rgba(20,16,30,.6),0 0 18px rgba(255,255,255,.5);pointer-events:none;transition:transform .12s";
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => (c.style.transform = "scale(.7)"), true);
    addEventListener("mouseup", () => (c.style.transform = ""), true);
  });`;

const answers = readAnswers();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: SIZE, recordVideo: { dir: RAW, size: SIZE } });
await context.addInitScript(CURSOR);
const page = await context.newPage();
const t0 = Date.now();
const now = () => (Date.now() - t0) / 1000;

// Scenes to keep, as [start, end] seconds in the main page's recording
const keep = [];
let open = null;
const start = (name) => { open = { name, from: now() }; };
const stop = () => { keep.push({ ...open, to: now() }); console.log(`scene ${open.name}: ${(now() - open.from).toFixed(1)} s`); open = null; };

// Moves the cursor to an element in steps, so the viewer can follow it, then clicks
async function glide(locator, { pause = 450, click = true } = {}) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
  await page.waitForTimeout(pause);
  if (click) await locator.click();
}

// Plays one quest on camera, at a pace a viewer can follow
async function playSlowly(id, pass) {
  await glide(page.locator(`[data-star="${id}"]`));
  const dialog = page.locator("dialog[open]");
  await page.waitForTimeout(1300);
  const [tab] = await Promise.all([page.context().waitForEvent("page"), glide(dialog.getByRole("link", { name: /Read this page/ }))]);
  await tab.close();
  await page.waitForTimeout(700);
  await glide(dialog.getByRole("button", { name: "Start quiz" }));
  await page.waitForTimeout(1200);
  for (const [qi, a] of answers[id].entries()) {
    const option = dialog.locator(`input[name="ls-q${qi}"]`).nth(pass ? a : (a + 1) % 4).locator("..");
    await glide(option, { pause: 350 });
    await page.waitForTimeout(500);
  }
  await glide(dialog.getByRole("button", { name: "Submit answers" }));
  await dialog.getByRole("heading", { name: pass ? "Passed" : "Not passed" }).waitFor({ timeout: 30000 });
}

const lit = (n) => page.getByRole("heading", { name: `${n} of 12 stars lit` }).first().waitFor({ timeout: 30000 });

try {
  await page.goto(APP);
  await page.getByRole("button", { name: /Log in with Internet Identity/ }).waitFor();

  start("welcome");
  await page.waitForTimeout(3000);
  await glide(page.getByRole("button", { name: /Log in with Internet Identity/ }), { click: false, pause: 900 });
  stop();

  // The II window is recorded too, as its own video
  const [ii] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: /Log in with Internet Identity/ }).click()]);
  const iiFrom = Date.now();
  await ii.waitForTimeout(1200);
  await ii.getByRole("button", { name: "Continue with passkey" }).click();
  await ii.waitForTimeout(900);
  await ii.getByRole("button", { name: "Create new identity" }).click();
  await ii.waitForTimeout(700);
  await ii.getByLabel("Identity name").or(ii.getByPlaceholder("Identity name")).first().pressSequentially("Demo learner", { delay: 70 });
  await ii.waitForTimeout(600);
  await ii.getByRole("button", { name: "Create identity" }).click();
  await ii.waitForTimeout(900);
  await ii.getByRole("button", { name: "Continue", exact: true }).click();
  const iiVideo = ii.video();
  const iiSeconds = (Date.now() - iiFrom) / 1000;
  await ii.waitForEvent("close", { timeout: 30000 }).catch(() => {});
  await page.locator("[data-star]").first().waitFor({ timeout: 30000 });

  start("first sky");
  await page.mouse.move(720, 450, { steps: 10 });
  await page.waitForTimeout(3500);
  stop();

  // Off camera: the hand-off sample state (quests 1, 3 and 7 done)
  for (const id of [1, 3, 7]) await play(page, id, answers, true);
  await lit(3);
  await page.mouse.move(700, 120);
  await page.waitForTimeout(1500);

  start("sample sky and a wrong quiz");
  await page.waitForTimeout(2000);
  await playSlowly(8, false);
  await page.waitForTimeout(3500); // the countdown ticks
  stop();
  await page.screenshot({ path: resolve(RAW, "still-quiz-result.png") });
  await page.locator("dialog[open]").getByRole("button", { name: "Back to the sky" }).click();

  console.log("waiting 65 s for the first cooldown to end (cut from the video)");
  await page.waitForTimeout(65_000);

  start("pass and ignite");
  await playSlowly(8, true);
  await page.waitForTimeout(3500); // the star ignites in the result
  await glide(page.locator("dialog[open]").getByRole("button", { name: "Back to the sky" }));
  await lit(4);
  await page.mouse.move(700, 120, { steps: 20 });
  await page.waitForTimeout(3500);
  stop();
  const ignite = keep.at(-1);
  await page.screenshot({ path: resolve(RAW, "still-map.png") });

  start("tutor opens");
  await glide(page.getByRole("button", { name: "Ask the AI tutor" }));
  await page.waitForTimeout(3000);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
  stop();

  // Off camera: every other quest
  for (const id of PATH_ORDER.filter((q) => ![1, 3, 7, 8].includes(q))) await play(page, id, answers, true);
  await lit(12);
  await page.mouse.move(720, 60);
  await page.waitForTimeout(1500);

  start("complete sky");
  await page.mouse.move(420, 520, { steps: 60 });
  await page.mouse.move(1000, 420, { steps: 60 });
  await page.waitForTimeout(2500);
  stop();
  await page.screenshot({ path: resolve(RAW, "still-complete.png") });

  await page.close();
  const mainVideo = await page.video().path();
  const iiPath = await iiVideo.path();
  await context.close();
  await browser.close();

  // Cut and join with ffmpeg: the II clip goes after the welcome scene
  const ff = (...args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
  const clip = (src, from, to, name) => {
    const out = resolve(RAW, `${name}.mp4`);
    ff("-ss", from.toFixed(2), "-to", to.toFixed(2), "-i", src, "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-an", out);
    return out;
  };
  const parts = [];
  keep.forEach((s, i) => {
    parts.push(clip(mainVideo, s.from, s.to, `part-${i}`));
    if (i === 0) parts.push(clip(iiPath, 0.3, iiSeconds + 0.6, "part-ii"));
  });
  const list = resolve(RAW, "parts.txt");
  writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
  const demo = resolve(OUT, "learnsphere-demo.mp4");
  ff("-f", "concat", "-safe", "0", "-i", list, "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", demo);

  // The loop: the last 8 s of the ignite scene (result, back to the sky, the new star)
  const loop = resolve(OUT, "learnsphere-ignite-loop.mp4");
  ff("-ss", Math.max(ignite.from, ignite.to - 8).toFixed(2), "-to", ignite.to.toFixed(2), "-i", mainVideo, "-vf", "fps=30,scale=960:-2,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-movflags", "+faststart", "-an", loop);

  for (const [png, webp] of [["still-map", "learnsphere-map"], ["still-quiz-result", "learnsphere-quiz"], ["still-complete", "learnsphere-complete-sky"]]) {
    ff("-i", resolve(RAW, `${png}.png`), "-c:v", "libwebp", "-quality", "82", resolve(OUT, `${webp}.webp`));
  }

  const probe = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
  for (const f of ["learnsphere-demo.mp4", "learnsphere-ignite-loop.mp4", "learnsphere-map.webp", "learnsphere-quiz.webp", "learnsphere-complete-sky.webp"]) {
    const p = resolve(OUT, f);
    const kb = (statSync(p).size / 1024).toFixed(0);
    console.log(`${f}: ${kb} KB${f.endsWith(".mp4") ? `, ${probe(p).toFixed(1)} s` : ""}`);
  }
} catch (err) {
  console.error(err);
  await browser.close();
  process.exit(1);
}
