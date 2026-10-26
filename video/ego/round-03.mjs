const task = await taskSpace(2);
const page = task.page("p1");
await page.goto("https://jejak.base44.app/journal");
await page.waitForTimeout(2500);
console.log({ url: await page.url() });
console.log(await page.snapshot());
