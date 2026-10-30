// Accessibility checks on the real app with a fresh local Internet Identity:
//   1. contrast: each visible text against the worst pixel behind it, measured with the
//      text hidden (glow halos are hidden too, so the result is conservative)
//   2. keyboard: tab order on the map, Enter and Escape on a quest, arrow keys in the quiz
//   3. motion: no running animation and still canvases under prefers-reduced-motion, and
//      still canvases while the tab is hidden
//
//   node scripts/checks.mjs
// Needs the local network, the deployed canisters and `npm run dev` on port 5173.
import { chromium } from "playwright";
import { APP, login, play, readAnswers } from "./lib.mjs";

const answers = readAnswers();
const results = { contrast: [], keyboard: [], motion: [] };
const report = (kind, line) => {
  results[kind].push(line);
  console.log(`[${kind}] ${line}`);
};

// Runs in the page: list each visible text element with its colour, size and box
function listTexts() {
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const rgba = (css) => {
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = "#000";
    probe.fillStyle = css;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const seen = new Set();
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!n.nodeValue.trim() || !el || seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    if (el.closest("[disabled], [aria-disabled='true'], .ls-sr-only")) continue;
    // Behind an open modal dialog the page is inert and dimmed: only the dialog counts
    const modal = document.querySelector("dialog[open]");
    if (modal && !modal.contains(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const r = range.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    // Skip text covered by a panel it is not part of (the tutor over the side panel)
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    const cover = document.elementsFromPoint(cx, cy).find((e) => e.closest(".ls-glass, [role='dialog']"));
    const panel = cover?.closest(".ls-glass, [role='dialog']");
    if (panel && !panel.contains(el) && !el.contains(panel)) continue;
    // Opacity of the element and its ancestors fades the text too
    let fade = 1;
    for (let e = el; e; e = e.parentElement) fade *= Number(getComputedStyle(e).opacity);
    const [cr, cg, cb, ca] = rgba(cs.color);
    out.push({
      text: n.nodeValue.trim().slice(0, 40),
      color: [cr, cg, cb, ca * fade],
      size: parseFloat(cs.fontSize),
      weight: Number(cs.fontWeight),
      glass: Boolean(el.closest(".ls-glass, .ls-glass-pill, dialog, .ls-tag, .ls-pill-btn, .ls-cta")),
      box: [Math.max(0, r.left), Math.max(0, r.top), Math.min(innerWidth, r.right), Math.min(innerHeight, r.bottom)],
    });
  }
  return out;
}

// Runs in the page: for each text box, the worst contrast against the pixels behind it
async function worstContrast({ shot, texts }) {
  const img = new Image();
  img.src = `data:image/png;base64,${shot}`;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return texts.map((t) => {
    const [x0, y0, x1, y1] = t.box.map(Math.round);
    const data = ctx.getImageData(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)).data;
    let worst = Infinity, worstBg = null;
    for (let i = 0; i < data.length; i += 4 * 3) {
      const bg = [data[i], data[i + 1], data[i + 2]];
      const a = t.color[3];
      const fg = t.color.slice(0, 3).map((v, k) => v * a + bg[k] * (1 - a));
      const [hi, lo] = [lum(fg), lum(bg)].sort((p, q) => q - p);
      const ratio = (hi + 0.05) / (lo + 0.05);
      if (ratio < worst) { worst = ratio; worstBg = bg; }
    }
    return { ...t, ratio: worst, bg: worstBg };
  });
}

async function contrast(page, screen) {
  await page.waitForTimeout(900);
  const texts = await page.evaluate(listTexts);
  const hide = await page.addStyleTag({ content: "* { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; } ::placeholder { color: transparent !important; }" });
  await page.waitForTimeout(100);
  const shot = (await page.screenshot()).toString("base64");
  await hide.evaluate((el) => el.remove());
  const measured = await page.evaluate(worstContrast, { shot, texts });
  const large = (t) => t.size >= 24 || (t.size >= 18.66 && t.weight >= 700);
  const fails = measured.filter((t) => t.ratio < (large(t) ? 3 : 4.5));
  const worstOf = (list) => list.reduce((w, t) => (!w || t.ratio < w.ratio ? t : w), null);
  const fmt = (t) => (t ? `${t.ratio.toFixed(2)}:1 "${t.text}" (${t.size}px, text rgba(${t.color.slice(0, 3).join(",")},${t.color[3].toFixed(2)}) on rgb(${t.bg.join(",")}))` : "none");
  report("contrast", `${screen}: ${measured.length} texts, ${fails.length} below the limit; worst on glass ${fmt(worstOf(measured.filter((t) => t.glass)))}; worst anywhere ${fmt(worstOf(measured))}`);
  for (const t of fails) report("contrast", `  FAIL ${screen}: ${fmt(t)}${large(t) ? " (large text, limit 3:1)" : ""}`);
}

const describe = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return "body";
  return el.dataset.star ? `star ${el.dataset.star}` : `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}"`;
};

// Needs contrast() for the quiz screen on the way
async function keyboard(page) {
  await page.evaluate(() => document.activeElement?.blur());
  const order = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    order.push(await page.evaluate(describe));
  }
  const stars = [...new Set(order.filter((d) => d.startsWith("star ")))];
  report("keyboard", `tab order (first 30 stops): ${order.join(" > ")}`);
  report("keyboard", `${stars.length} of 12 stars reachable by Tab`);
  const ring = await page.evaluate(() => {
    const el = document.querySelector('[data-star="2"]');
    el.focus();
    const cs = getComputedStyle(el);
    return `outline ${cs.outlineStyle} ${cs.outlineWidth}, filter ${cs.filter}`;
  });
  report("keyboard", `focused star style: ${ring}`);

  await page.keyboard.press("Enter");
  const dialog = page.locator("dialog[open]");
  await dialog.waitFor();
  report("keyboard", `Enter on star 2 opens the quest; focus on ${await page.evaluate(describe)} (${await page.evaluate(() => document.activeElement.id)})`);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" }).catch(() => {});
  await page.waitForTimeout(200);
  report("keyboard", `Escape closes it: ${!(await page.locator("dialog[open]").count())}; focus back on ${await page.evaluate(describe)}`);

  await page.keyboard.press("Enter");
  const [tab] = await Promise.all([page.context().waitForEvent("page"), dialog.getByRole("link", { name: /Read this page/ }).click()]);
  await tab.close();
  await dialog.getByRole("button", { name: "Start quiz" }).click();
  await dialog.locator('input[name="ls-q0"]').first().focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  const checked = await dialog.locator('input[name="ls-q0"]').evaluateAll((els) => els.findIndex((e) => e.checked));
  report("keyboard", `quiz: focus on answer A, ArrowDown twice selects answer ${"ABCD"[checked]} (expected C)`);
  await contrast(page, "quiz 1440");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  await page.getByRole("button", { name: "Ask the AI tutor" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog", { name: "AI tutor" }).waitFor();
  report("keyboard", `Enter on the orb opens the tutor; focus on ${await page.evaluate(describe)}`);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  report("keyboard", `Escape with focus outside the panel closes it: ${!(await page.getByRole("dialog", { name: "AI tutor" }).count())}`);
}

// Canvas pixels and running animations, twice, some time apart
async function stillness(page, waitMs = 1500) {
  const snap = () => page.evaluate(() => ({
    canvases: [...document.querySelectorAll("canvas")].map((c) => c.toDataURL()),
    running: document.getAnimations().filter((a) => a.playState === "running").length,
  }));
  const a = await snap();
  await page.waitForTimeout(waitMs);
  const b = await snap();
  const changed = a.canvases.filter((d, i) => d !== b.canvases[i]).length;
  return { changed, total: a.canvases.length, running: b.running };
}

async function motion(browser) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion });
    const page = await context.newPage();
    await page.goto(APP);
    await login(page, `PW motion ${reducedMotion}`);
    await page.waitForTimeout(1000);
    const s = await stillness(page);
    report("motion", `${reducedMotion}: ${s.changed} of ${s.total} canvases changed in 1.5 s; ${s.running} CSS animations running`);
    if (reducedMotion === "no-preference") {
      // Simulate a hidden tab: the loops must stop drawing
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForTimeout(300);
      const h = await stillness(page);
      report("motion", `hidden tab: ${h.changed} of ${h.total} canvases changed in 1.5 s`);
    }
    await context.close();
  }
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(APP);
  await page.getByRole("button", { name: /Log in with Internet Identity/ }).waitFor();
  await contrast(page, "welcome 1440");
  await login(page, "PW checks");
  await play(page, 1, answers, true);
  await play(page, 3, answers, false, { result: () => contrast(page, "result not passed 1440") });
  await page.getByRole("heading", { name: "1 of 12 stars lit" }).first().waitFor();
  await contrast(page, "map 1440");
  await page.locator('[data-star="2"]').click();
  await contrast(page, "quest detail 1440");
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Ask the AI tutor" }).click();
  await page.getByRole("dialog", { name: "AI tutor" }).waitFor();
  await contrast(page, "tutor 1440");
  await page.getByRole("button", { name: "Close the tutor" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await contrast(page, "map 390");
  await page.setViewportSize({ width: 1440, height: 900 });
  // Let the layout switch back from the phone map before the tab order is read
  await page.getByRole("heading", { name: "1 of 12 stars lit" }).first().waitFor();
  await page.waitForTimeout(800);
  await keyboard(page);
  await context.close();
  await motion(browser);
} finally {
  await browser.close();
}
