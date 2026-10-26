const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace(1);
const page = task.page("p1");
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForTimeout(8500); // ride through identifying -> journey
await lib.injectCursor(page);

// ---- a05b: sample label stamp (verified) ----
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Try a sample label"));
  b?.scrollIntoView({ block: "center", behavior: "instant" });
});
await page.waitForTimeout(600);
let rec = lib.makeRecorder(page, "a05-label");
await rec.start();
await lib.cursorClick(page, "text=Try a sample label");
await page.waitForTimeout(1200);
// scroll to the verified stop so the stamp + trade data read on camera
await page.evaluate(() => document.getElementById("stop-entry-2")?.scrollIntoView({ block: "center", behavior: "smooth" }));
await page.waitForTimeout(2500);
console.log("a05 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a05-label.mp4");
await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/a05-verify.png" });

// ---- a07: receipt upload -> journal live fill ----
await page.goto("https://jejak.base44.app/trace");
await page.waitForTimeout(1500);
rec = lib.makeRecorder(page, "a07-receipt");
await rec.start();
await page.evaluate(() => window.__cursor?.move(720, 450));
// the receipt input is the third file input on the page
await page.setInputFiles("input[type=file] >> nth=2", ["/Users/udingethe/Dev/jejak/video/assets/receipt.png"]);
await page.waitForTimeout(4000);
await page.waitForURL(/journal\?receipt=/, { timeout: 20000 }).catch(() => {});
await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/a07-start.png" });
// let the receipt fill in — poll up to 75s
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(5000);
  const done = await page.evaluate(() => document.body.innerText.match(/traced/gi)?.length ?? 0);
  console.log("traced lines:", done);
  if (done >= 3) break;
}
console.log("a07 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a07-receipt.mp4");
await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/a07-end.png" });
