const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace(1);
const page = task.page("p1");
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await page.goto("https://jejak.base44.app/trace");
await page.waitForTimeout(1500);
await lib.injectCursor(page);

// ---- a09-describe: type a description -> real AI trace ----
let rec = lib.makeRecorder(page, "a09-describe");
await rec.start();
await lib.cursorClick(page, 'input[placeholder*="merino"]').catch(() => {});
await page.evaluate(() => {
  const el = document.querySelector('input[placeholder*="merino"]');
  el?.focus();
});
await page.keyboard.type("grey merino jumper from Uniqlo", { delay: 45 });
await page.waitForTimeout(700);
await lib.cursorClick(page, "text=Trace it");
// wait for journey to land (AI takes a few seconds)
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(1000);
  const onJourney = await page.evaluate(() => document.body.innerText.includes("WHERE IT CAME FROM"));
  if (onJourney) break;
}
await page.waitForTimeout(2500);
console.log("a09 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a09-describe.mp4");
await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/a09-end.png" });

// ---- m01: mobile pass — trace home with SNAP stamp ----
await lib.stageViewport(page, { w: 390, h: 844, mobile: true });
await page.goto("https://jejak.base44.app/trace");
await page.waitForTimeout(2000);
await lib.injectCursor(page);
rec = lib.makeRecorder(page, "m01-mobile");
await rec.start();
await page.waitForTimeout(2500);
await page.mouse.wheel(0, 350);
await page.waitForTimeout(1500);
console.log("m01 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/m01-mobile.mp4");
await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/m01.png" });
