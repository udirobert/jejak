const task = await taskSpace(2);
const page = task.page("p1");
await page.goto("https://jejak.base44.app/journal");
console.log("Handing off for sign-in");
await task.handOff();
