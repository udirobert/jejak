const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = task.page("p1");
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await page.mouse.wheel(0, 60);

// continue from the open AskBrandSheet: type a brand, draft the letter
let rec = lib.makeRecorder(page, "v2-letter-draft");
await rec.start();
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
await page.waitForTimeout(600);
await lib.cursorClick(page, "text=Draft the letter");
// wait for the drafted letter to appear
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(1000);
  const drafted = await page.evaluate(
    () =>
      document.body.innerText.toLowerCase().includes("dear") ||
      document.body.innerText.toLowerCase().includes("mailto") ||
      document.body.innerText.toLowerCase().includes("two weeks"),
  );
  if (drafted) break;
}
await page.waitForTimeout(4000); // let it read on camera
console.log("letter-draft frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-letter-draft.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-letter-draft-end.png` });
