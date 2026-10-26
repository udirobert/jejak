const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = task.page("p8") ?? await task.newPage();
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await page.goto("https://jejak.base44.app/trace");
await page.waitForLoadState();
await page.waitForTimeout(2500);
await lib.injectCursor(page);
await page.mouse.wheel(0, 80);

// ---- v2-receipt: upload -> journal fills live ----
// Workflows aren't wired server-side, so after upload we fire
// processReceipt ourselves with the real automation payload shape.
let rec = lib.makeRecorder(page, "v2-receipt");
const t0 = Date.now();
await rec.start();
await page.evaluate(() => window.__cursor?.move(720, 450));
await page.setInputFiles("input[type=file] >> nth=2", [`${DIR}/assets/receipt.png`]);
await page.waitForURL(/journal\?receipt=/, { timeout: 25000 }).catch(() => {});
const url = await page.url();
const receiptId = url.match(/receipt=([a-f0-9]+)/i)?.[1];
console.log({ receiptAt: (Date.now() - t0) / 1000, receiptId });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${DIR}/raw/v2-receipt-start.png` });
// fire the automation payload
await page.evaluate(async (rid) => {
  const token = localStorage.getItem("base44_access_token") || "";
  await fetch("/api/apps/6ace77fd3de4615d81326900/functions/processReceipt", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ event: { entity_id: rid } }),
  });
}, receiptId);
console.log({ invokedAt: (Date.now() - t0) / 1000 });
// watch lines tick in
let filledAt = -1;
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(2500);
  const done = await page.evaluate(() => document.body.innerText.match(/traced/gi)?.length ?? 0);
  console.log("traced:", done);
  if (done >= 3) {
    filledAt = (Date.now() - t0) / 1000;
    break;
  }
}
console.log({ filledAt });
// hold on the filled receipt + new journal entries beneath (J9)
await page.waitForTimeout(12000);
await page.mouse.wheel(0, 300);
await page.waitForTimeout(4000);
console.log("receipt frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-receipt.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-receipt-end.png` });
