import { WebUI } from "jsr:@webui/deno-webui";
import { ulid } from "jsr:@std/ulid";

const webui = new WebUI();
WebUI.setFolderMonitor(true);
webui.setRootFolder("./client/build");

const kv = await Deno.openKv();

const index = await Deno.readTextFile("./client/build/index.html");

webui.bind("startButton", (e) => {
  console.log(`ui send "${e.element}" ss`);
  return "backend response";
});

webui.bind("test_time", () => {
  return Date.now();
});

async function createEntry(name: string) {
  const entryId = ulid();
  await kv.set(["entries", entryId, "name"], name);
}

async function start(entryId: string) {
  await setActiveTask(entryId);
  await kv.atomic()
    .set(["entries", entryId, "start"], (new Date()).toISOString())
    .commit();
}

async function stop(entryId: string) {
  await clearActiveTask();
  await kv.set(["entries", entryId, "stop"], (new Date()).toISOString());
}

async function updateName(entryId: string, name: string) {
  await kv.set(["entries", entryId, "name"], name);
}

////
async function setActiveTask(entryId: string) {
  await kv.set(["active"], entryId);
}
async function clearActiveTask() {
  await kv.set(["active"], null);
}

/////////////////// Projects
// save project

// getProject

// start / stop

// reports

// GetWeeklyReport
// per week, per projects

webui.setPort(8081);
// await webui.show(index);

// For developing use the below
//
// Show a new window and point to our custom web server
// Assuming the custom web server is running on port
// 8080...
await webui.showBrowser("http://localhost:5173/", WebUI.Browser.AnyBrowser);

await WebUI.wait();
