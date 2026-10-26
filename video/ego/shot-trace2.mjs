const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace(1);
const page = task.page("p1");
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForLoadState();
await page.waitForTimeout(900);
await lib.injectCursor(page);

// ---- a03: identifying -> journey ----
let rec = lib.makeRecorder(page, "a03-identify");
await rec.start();
await page.waitForTimeout(9000);
console.log("a03 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a03-identify.mp4");
console.log(await page.snapshot({ scope: "only_within_viewport" }));
