const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace(1);
const page = task.page("p1");
await page.cdp("Page.bringToFront").catch(() => {});
await lib.injectCursor(page);

// ---- a04: click through stops on journey (map postmarks + entries) ----
let rec = lib.makeRecorder(page, "a04-journey");
await rec.start();
for (const i of [1, 2, 3]) {
  await lib.cursorClick(page, `#stop-entry-${i}`);
  await page.waitForTimeout(900);
}
await page.waitForTimeout(600);
console.log("a04 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a04-journey.mp4");

// ---- a05: sample label stamp ----
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Try a sample label"));
  if (b) b.scrollIntoView({ block: "center", behavior: "instant" });
});
await page.waitForTimeout(500);
rec = lib.makeRecorder(page, "a05-label");
await rec.start();
await lib.cursorClick(page, "text=Try a sample label");
await page.waitForTimeout(3500);
console.log("a05 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a05-label.mp4");

// ---- a06: money split guess -> reveal ----
await lib.cursorClick(page, 'text=Where did the');
await page.waitForTimeout(1500);
rec = lib.makeRecorder(page, "a06-split");
await rec.start();
await page.evaluate(async () => {
  const el = document.querySelector('input[type="range"]');
  if (!el) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  for (let v = 15; v >= 4; v--) {
    setter.call(el, String(v));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 90));
  }
});
await page.waitForTimeout(400);
await lib.cursorClick(page, "text=Reveal the split");
await page.waitForTimeout(6000);
console.log("a06 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a06-split.mp4");
