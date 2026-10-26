const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = task.page("p1");
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await page.goto("https://jejak.base44.app/trace");
await page.waitForLoadState();
await page.waitForTimeout(2500);
await lib.injectCursor(page);

// ---- v2-streak: home streak chip -> /impact ----
const chip = await page.evaluate(() => document.body.innerText.match(/\d+ traced ·/)?.[0] ?? null);
console.log({ chip });
await page.mouse.wheel(0, 80);
let rec = lib.makeRecorder(page, "v2-streak");
await rec.start();
await page.waitForTimeout(1200);
await lib.cursorClick(page, "text=traced ·");
await page.waitForTimeout(3500); // /impact lands + reveals
await page.mouse.wheel(0, 260);
await page.waitForTimeout(2500);
console.log("streak frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-streak.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-streak-end.png` });
console.log({ url: await page.url() });
