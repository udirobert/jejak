const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = await task.newPage();
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await page.goto("https://jejak.base44.app/trace");
await page.waitForLoadState();
await page.waitForTimeout(2500);
await lib.injectCursor(page);

const chip = await page.evaluate(() => document.body.innerText.match(/\d+\s+traced\s+·/i)?.[0] ?? null);
console.log({ chip });
await page.mouse.wheel(0, 80);
let rec = lib.makeRecorder(page, "v2-streak");
await rec.start();
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /traced\s+·/i.test(x.textContent));
  if (b) {
    const r = b.getBoundingClientRect();
    window.__cursor?.move(r.x + r.width / 2, r.y + r.height / 2);
  }
});
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /traced\s+·/i.test(x.textContent));
  window.__cursor?.click();
  b?.click();
});
await page.waitForTimeout(3500); // /impact lands
await page.mouse.wheel(0, 260);
await page.waitForTimeout(2500);
console.log("streak frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-streak.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-streak-end.png` });
console.log({ url: await page.url() });
