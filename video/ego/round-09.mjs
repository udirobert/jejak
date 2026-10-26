const task = await taskSpace(1);
const page = task.page("p1");
await page.goto("https://jejak.base44.app/journal");
await page.waitForTimeout(3500);
await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/journal-live.png" });
console.log(await page.url());
