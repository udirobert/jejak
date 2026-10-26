const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = task.page("p1");
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await page.goto("https://jejak.base44.app/trace");
await page.waitForLoadState();
await page.waitForTimeout(2000);
await lib.injectCursor(page);

// ---- v2-receipt: upload -> journal fills live (workflows are live now) ----
// Logs receiptAt / filledAt as offsets (s) into the mp4 for the edit.
let rec = lib.makeRecorder(page, "v2-receipt");
const t0 = Date.now();
await rec.start();
await page.evaluate(() => window.__cursor?.move(720, 450));
// receipt input is the 3rd file input (camera, library, receipt)
await page.setInputFiles("input[type=file] >> nth=2", [`${DIR}/assets/receipt.png`]);
await page.waitForURL(/journal\?receipt=/, { timeout: 25000 }).catch(() => {});
const receiptAt = (Date.now() - t0) / 1000;
console.log({ receiptAt });
await page.screenshot({ path: `${DIR}/raw/v2-receipt-start.png` });
// poll for lines flipping to traced; workflows stamp them in over ~60-90s
let filledAt = -1;
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(5000);
  const done = await page.evaluate(() => document.body.innerText.match(/traced/gi)?.length ?? 0);
  console.log("traced lines:", done);
  if (done >= 3) {
    filledAt = (Date.now() - t0) / 1000;
    break;
  }
}
console.log({ filledAt });
// keep rolling so stories write in for the J9 beat
await page.waitForTimeout(18000);
console.log("receipt frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-receipt.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-receipt-end.png` });
