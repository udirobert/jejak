const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = await task.page('p2');
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

await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForLoadState();
await page.waitForTimeout(2000);
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
await page.evaluate(() => {
  const s = document.querySelector("input[type=range]");
  if (s) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(s, 22);
    s.dispatchEvent(new Event("input", { bubbles: true }));
    s.dispatchEvent(new Event("change", { bubbles: true }));
  }
});
await page.waitForTimeout(800);
await clickBtn("reveal the split");
let anchoredAt = -1;
for (let i = 0; i < 50; i++) {
  await page.waitForTimeout(1000);
  const ok = await page.evaluate(() => /anchored onchain|settle tx|anchor failed/i.test(document.body.innerText));
  if (ok) { anchoredAt = (Date.now() - t0) / 1000; break; }
}
console.log({ anchoredAt });
await page.waitForTimeout(7000);
console.log("stake frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v3-stake.mp4`);
await page.screenshot({ path: `${DIR}/raw/v3-stake-end.png` });
