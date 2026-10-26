const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = await task.newPage();
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

// ---- v3-stake: hoodie flow -> journey -> split -> commit+settle ----
await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForLoadState();
await page.waitForTimeout(2000);
// wait for journey screen's money button to appear (identifying -> journey)
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
let anchoredAt = -1;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(1000);
  const ok = await page.evaluate(() => /anchored onchain|settle tx/i.test(document.body.innerText));
  if (ok) { anchoredAt = (Date.now() - t0) / 1000; break; }
}
console.log({ anchoredAt });
await page.waitForTimeout(7000);
console.log("stake frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v3-stake.mp4`);
await page.screenshot({ path: `${DIR}/raw/v3-stake-end.png` });

// ---- v3-passport: /impact -> passport sheet ----
await page.goto("https://jejak.base44.app/impact");
await page.waitForLoadState();
await page.waitForTimeout(2500);
rec = lib.makeRecorder(page, "v3-passport");
await rec.start();
await page.waitForTimeout(1000);
// click the button inside the passport card (amber pill near "passkey smart account")
const hit = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")];
  const el = btns.find((b) => /passport|passkey/i.test(b.innerText) && b.offsetParent)
    || [...document.querySelectorAll("button")].find((b) => b.closest("div")?.innerText?.includes("passkey smart account"));
  if (el) { el.scrollIntoView({ block: "center" }); el.click(); return el.innerText.slice(0, 60); }
  return null;
});
console.log({ passportBtn: hit });
await page.waitForTimeout(5000);
const open = await page.evaluate(() => /Your Jejak passport/i.test(document.body.innerText));
console.log({ passportOpen: open });
await page.waitForTimeout(4000);
console.log("passport frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v3-passport.mp4`);
await page.screenshot({ path: `${DIR}/raw/v3-passport-end.png` });
