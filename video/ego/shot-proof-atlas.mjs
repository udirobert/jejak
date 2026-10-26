const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace(1);
const page = task.page("p1");
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });

// Check receipt/story state first
await page.goto("https://jejak.base44.app/journal");
await page.waitForTimeout(3000);
const state = await page.evaluate(() => ({
  traced: document.body.innerText.match(/traced/gi)?.length ?? 0,
  storyDone: document.body.innerText.includes("story on its way") ? "pending" : "maybe-done",
}));
console.log(state);
await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/journal-check.png" });

// ---- a10-proof: open journal entry -> journey -> OPEN PROOF -> anchor ----
await lib.injectCursor(page);
await lib.cursorClick(page, "text=Everyday Hoodie").catch(() => {});
await page.waitForTimeout(1500);
await lib.cursorClick(page, "text=Open full journey").catch(() => {});
await page.waitForTimeout(2000);
let rec = lib.makeRecorder(page, "a10-proof");
await rec.start();
await lib.cursorClick(page, 'button[aria-label="Open proof record"]').catch(() =>
  page.evaluate(() => [...document.querySelectorAll("button")].find(b => b.textContent.includes("PROOF"))?.click())
);
await page.waitForTimeout(2500);
await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/a10-drawer.png" });
await page.waitForTimeout(3000);
console.log("a10 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a10-proof.mp4");

// ---- a08-atlas ----
await page.goto("https://jejak.base44.app/atlas");
await page.waitForTimeout(2500);
await lib.injectCursor(page);
rec = lib.makeRecorder(page, "a08-atlas");
await rec.start();
await page.mouse.wheel(0, 500);
await page.waitForTimeout(2000);
await page.mouse.wheel(0, -300);
await page.waitForTimeout(1500);
console.log("a08 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a08-atlas.mp4");
await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/a08.png" });
