const task = await taskSpace("jejak-story-v2");
const page = await task.newPage();
await page.cdp("Page.bringToFront").catch(() => {});
await page.cdp("Emulation.setDeviceMetricsOverride", {
  width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
}).catch(() => {});
await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForLoadState();
await page.waitForTimeout(2500);
await page.evaluate(() => {
  const els = [...document.querySelectorAll("button, a, [role=button]")];
  const el = els.find((e) => e.innerText?.includes("Where did the") && e.offsetParent);
  if (el) el.click();
});
let onJourney = false;
for (let i = 0; i < 20; i++) {
  onJourney = await page.evaluate(() => !!document.querySelector(".snap-y"));
  if (onJourney) break;
  await page.waitForTimeout(1000);
}
console.log({ onJourney });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/story-hero.png" });
await page.evaluate(() => {
  const s = document.querySelector(".snap-y");
  if (s) s.scrollTo({ top: s.clientHeight * 1, behavior: "auto" });
});
await page.waitForTimeout(1800);
await page.screenshot({ path: "/tmp/story-stop1.png" });
await page.evaluate(() => {
  const s = document.querySelector(".snap-y");
  if (s) s.scrollTo({ top: s.clientHeight * 2, behavior: "auto" });
});
await page.waitForTimeout(1800);
await page.screenshot({ path: "/tmp/story-stop2.png" });
await page.evaluate(() => {
  const s = document.querySelector(".snap-y");
  if (s) s.scrollTo({ top: s.scrollHeight, behavior: "auto" });
});
await page.waitForTimeout(1800);
await page.screenshot({ path: "/tmp/story-money.png" });
