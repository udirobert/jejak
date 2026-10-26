const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = await task.newPage();
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });

// Ride the sample flow to the split screen (not recorded), then shoot the letter.
await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForLoadState();
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(500);
  const onJourney = await page.evaluate(
    () =>
      !!document.querySelector('[aria-label*="Map of the"], [id^="stop-entry"]') ||
      document.body.innerText.includes("stops ·"),
  );
  if (onJourney) break;
}
await page.waitForTimeout(1500);
await lib.injectCursor(page);
await lib.cursorClick(page, "text=Where did the").catch(async () => {
  await lib.cursorClick(page, "text=money");
});
await page.waitForTimeout(2000);
// reveal first so the sheet opens over a finished screen
await page.evaluate(() => {
  const el = document.querySelector('input[type="range"]');
  if (el) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(el, "5");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
await lib.cursorClick(page, "text=Reveal the split").catch(() => {});
await page.waitForTimeout(2500);

// ---- v2-letter2: sheet opens -> type brand -> draft -> letter reads ----
await page.mouse.wheel(0, 60);
let rec = lib.makeRecorder(page, "v2-letter2");
await rec.start();
await lib.cursorClick(page, "text=Ask the brand");
await page.waitForTimeout(1800);
await page.evaluate(async () => {
  const input = [...document.querySelectorAll("input")].find((i) =>
    (i.placeholder || "").toLowerCase().includes("uniqlo"),
  );
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  const text = "High-street retailer";
  for (let i = 1; i <= text.length; i++) {
    setter.call(input, text.slice(0, i));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 55));
  }
});
await page.waitForTimeout(500);
await lib.cursorClick(page, "text=Draft the letter");
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  const drafted = await page.evaluate(() => {
    const t = document.body.innerText.toLowerCase();
    return t.includes("dear") || t.includes("two weeks") || t.includes("send it yourself") || t.includes("check in");
  });
  if (drafted) break;
}
await page.waitForTimeout(5000);
console.log("letter2 frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-letter2.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-letter2-end.png` });
