const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = task.page("p1");
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await page.goto("https://jejak.base44.app/atlas");
await page.waitForLoadState();
await page.waitForTimeout(3500);
await lib.injectCursor(page);

// ---- v2-ambient: ships + wave shimmer, no cursor ----
await page.evaluate(() => window.__cursor?.hide());
let rec = lib.makeRecorder(page, "v2-ambient");
await rec.start();
await page.mouse.wheel(0, 320); // zoom toward LOD where vessels read
await page.waitForTimeout(2500);
await page.mouse.wheel(0, 140);
await page.waitForTimeout(7000); // idle — let the sea carry the shot
console.log("ambient frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-ambient.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-ambient-end.png` });

// ---- v2-ticker: empty sheet peek, corridor lanes cycling ----
const tickerOn = await page.evaluate(() => document.body.innerText.match(/→/g)?.length >= 2);
console.log({ tickerOn });
await page.mouse.wheel(0, -60);
rec = lib.makeRecorder(page, "v2-ticker");
await rec.start();
await page.waitForTimeout(12000); // ~2 rotations
console.log("ticker frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-ticker.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-ticker-end.png` });

// ---- v2-globe: ink atlas -> planet morph -> drag-spin -> morph back ----
rec = lib.makeRecorder(page, "v2-globe");
await rec.start();
await page.waitForTimeout(800);
await lib.cursorClick(page, "text=Globe");
await page.waitForTimeout(2500); // morph lands
// slow drag-spin across the globe centre
const cx = 720, cy = 470;
await page.mouse.move(cx - 260, cy);
await page.mouse.down();
for (let i = 1; i <= 20; i++) {
  await page.mouse.move(cx - 260 + i * 26, cy + Math.sin(i / 3) * 12);
  await page.waitForTimeout(55);
}
await page.mouse.up();
await page.waitForTimeout(3500); // let it coast
await lib.cursorClick(page, "text=Map").catch(() => {});
await page.waitForTimeout(2500); // morph back to ink
console.log("globe frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-globe.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-globe-end.png` });
