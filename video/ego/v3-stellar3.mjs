const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = await task.page("p1");
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await lib.injectCursor(page);

const clickBtn = async (txt) =>
  page.evaluate((t) => {
    const els = [...document.querySelectorAll("button, a, [role=button]")];
    const el = els.find((e) => e.innerText?.trim().toLowerCase().includes(t) && e.offsetParent);
    if (el) { el.scrollIntoView({ block: "center" }); el.click(); return el.innerText.slice(0, 60); }
    return null;
  }, txt.toLowerCase());

// ---- FIX 1: hydrate the SDK session before any invoke ----
await page.goto("https://jejak.base44.app/journal");
await page.waitForLoadState();
// wait for auth token to exist (session hydrated), up to 20s
let authed = false;
for (let i = 0; i < 20; i++) {
  authed = await page.evaluate(() =>
    Object.keys(localStorage).some((k) => /token|auth|session/i.test(k) && !!localStorage.getItem(k))
  );
  if (authed) break;
  await page.waitForTimeout(1000);
}
console.log({ authed });
await page.waitForTimeout(2000);

// ---- v3-stake: hoodie flow -> journey -> split -> commit+settle ----
await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForLoadState();
await page.waitForTimeout(2500);
let rec = lib.makeRecorder(page, "v3-stake");
const t0 = Date.now();
await rec.start();
let navAt = -1;
for (let i = 0; i < 30; i++) {
  const hit = await clickBtn("where did the");
  if (hit) { navAt = (Date.now() - t0) / 1000; console.log({ navAt, hit }); break; }
  await page.waitForTimeout(1000);
}
await page.waitForTimeout(2500);
const onSplit = await page.evaluate(() => /Guess first|Where your/i.test(document.body.innerText));
console.log({ onSplit });
// set slider to 18 then reveal
await page.evaluate(() => {
  const s = document.querySelector("input[type=range]");
  if (s) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(s, 18);
    s.dispatchEvent(new Event("input", { bubbles: true }));
    s.dispatchEvent(new Event("change", { bubbles: true }));
  }
});
await page.waitForTimeout(800);
await clickBtn("reveal the split");
// FIX 2: watch for anchored OR failed; on failed, click retry (up to 2 tries)
let anchoredAt = -1;
let retries = 0;
for (let i = 0; i < 45; i++) {
  await page.waitForTimeout(1000);
  const st = await page.evaluate(() => {
    const t = document.body.innerText;
    if (/anchored onchain|settle tx/i.test(t)) return "anchored";
    if (/anchor failed/i.test(t)) return "failed";
    return "pending";
  });
  if (st === "anchored") { anchoredAt = (Date.now() - t0) / 1000; break; }
  if (st === "failed" && retries < 2) {
    retries++;
    console.log({ retry: retries, at: (Date.now() - t0) / 1000 });
    await clickBtn("retry");
  }
}
console.log({ anchoredAt, retries });
await page.waitForTimeout(7000);
console.log("stake frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v3-stake.mp4`);
await page.screenshot({ path: `${DIR}/raw/v3-stake-end.png` });

// ---- v3-passport: /impact -> "The record" tab -> Set up / Create passport ----
await page.goto("https://jejak.base44.app/impact");
await page.waitForLoadState();
await page.waitForTimeout(2500);
rec = lib.makeRecorder(page, "v3-passport");
await rec.start();
await page.waitForTimeout(1000);
const tabHit = await clickBtn("the record");
console.log({ tabHit });
await page.waitForTimeout(1200);
// the passport card button says "Set up" (no wallet) or "Create passport" (empty state)
const hit = await clickBtn("create passport") || await clickBtn("set up");
console.log({ passportBtn: hit });
await page.waitForTimeout(5000);
const open = await page.evaluate(() => /Your Jejak passport|passkey/i.test(document.body.innerText));
console.log({ passportOpen: open });
await page.waitForTimeout(4000);
console.log("passport frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v3-passport.mp4`);
await page.screenshot({ path: `${DIR}/raw/v3-passport-end.png` });
