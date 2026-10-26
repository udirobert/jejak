const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace(1);
const page = task.page("p1");

await lib.stageViewport(page, { w: 1440, h: 900 });

// ---- a03-identify: sample hoodie -> identifying -> journey ----
await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForLoadState();
await page.waitForTimeout(600);
await lib.injectCursor(page);
let rec = lib.makeRecorder(page, "a03-identify");
await rec.start();
await page.waitForTimeout(7000); // scan msgs -> attributes -> IDENTIFIED -> journey lands
console.log("a03 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a03-identify.mp4");
await page.waitForLoadState();
console.log({ url: await page.url() });
console.log(await page.snapshot({ scope: "only_within_viewport" }));
