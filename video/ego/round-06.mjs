const task = await taskSpace("jejak-contra-video");
const page = task.page("p1");
console.log({ spaceId: task.spaceId });
await page.goto("https://jejak.base44.app/login");
await page.waitForTimeout(3000);
const shot = await page.screenshot({ path: "/Users/udingethe/Dev/jejak/video/raw/login-live.png" });
console.log({ url: await page.url(), shot });
