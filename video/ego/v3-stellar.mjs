const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = await task.newPage();
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await lib.injectCursor(page);

const clickText = async (txt) =>
  page.evaluate((t) => {
    const els = [...document.querySelectorAll("button, a, [role=button], div")];
    const el = els.find((e) => e.innerText?.trim().toLowerCase().includes(t) && e.offsetParent);
    if (el) { el.click(); return true; }
    return false;
  }, txt.toLowerCase());

// ---- v3-passport: /impact -> passport sheet ----
await page.goto("https://jejak.base44.app/impact");
await page.waitForLoadState();
await page.waitForTimeout(2500);
let rec = lib.makeRecorder(page, "v3-passport");
const t0 = Date.now();
await rec.start();
await page.waitForTimeout(1500);
await clickText("passport");
await page.waitForTimeout(3500);
console.log({ passportAt: (Date.now() - t0) / 1000 });
await page.waitForTimeout(3500);
console.log("passport frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v3-passport.mp4`);
await page.screenshot({ path: `${DIR}/raw/v3-passport-end.png` });

// ---- v3-stake: hoodie flow -> split -> commit+settle ----
await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForLoadState();
await page.waitForTimeout(1200);
// skip through journey to money split
await page.waitForTimeout(2000);
await clickText("continue");
await page.waitForTimeout(2000);
await clickText("follow the money");
await page.waitForTimeout(2000);
await clickText("next");
await page.waitForTimeout(2500);
const onSplit = await page.evaluate(() => /Where your|Guess first/i.test(document.body.innerText));
console.log({ onSplit });
rec = lib.makeRecorder(page, "v3-stake");
await rec.start();
// drag-ish: set slider then click reveal
await page.evaluate(() => {
  const s = document.querySelector("input[type=range]");
  if (s) { s.value = 18; s.dispatchEvent(new Event("input", { bubbles: true })); s.dispatchEvent(new Event("change", { bubbles: true })); }
});
await page.waitForTimeout(1200);
await clickText("reveal the split");
// wait for "guess anchored onchain" link to appear
let anchoredAt = -1;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(1000);
  const ok = await page.evaluate(() => /anchored onchain|settle tx/i.test(document.body.innerText));
  if (ok) { anchoredAt = (Date.now() - t0) / 1000; break; }
}
console.log({ anchoredAt });
await page.waitForTimeout(6000);
console.log("stake frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v3-stake.mp4`);
await page.screenshot({ path: `${DIR}/raw/v3-stake-end.png` });

// ---- v3-explorer: settle tx on stellar.expert ----
await page.goto("https://stellar.expert/explorer/testnet/tx/cfe9f2b9dc2ee67f99c622bb861cd42957f3738bac78a16bd8222a2b64b4765f");
await page.waitForLoadState();
await page.waitForTimeout(3000);
rec = lib.makeRecorder(page, "v3-explorer");
await rec.start();
await page.waitForTimeout(5000);
await page.mouse.wheel(0, 350);
await page.waitForTimeout(4000);
console.log("explorer frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v3-explorer.mp4`);
await page.screenshot({ path: `${DIR}/raw/v3-explorer-end.png` });
