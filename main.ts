import { WebUI } from "jsr:@webui/deno-webui";
import type { Timer } from "./client/src/types.ts";

const webui = new WebUI();
WebUI.setFolderMonitor(true);
webui.setRootFolder("./client/build");

Deno.mkdirSync("./.tak", { recursive: true });
const kv = await Deno.openKv("./.tak/db");

// tasks
webui.bind("startActiveTimer", async (e: WebUI.Event) => {
  console.log(e.arg.string(0), e.arg.string(1));
  await startActiveTimer(e.arg.string(0), e.arg.string(1));
});

webui.bind("stopActiveTimer", async () => {
  return JSON.stringify(await stopActive());
});

webui.bind("timers", async (_e: WebUI.Event) => {
  return JSON.stringify(await timers());
});

webui.bind("deleteTimer", async (e: WebUI.Event) => {
  const taskId = e.arg.string(0);
  console.log("deleting", taskId);
  await deleteTimer(taskId);
  return JSON.stringify(await timers());
});

webui.bind("updateTimerName", async (e: WebUI.Event) => {
  const taskId = e.arg.string(0);
  const newName = e.arg.string(1);
  console.log("update timer Name", taskId, newName);
  await updateTimerName(taskId, newName);
});

webui.bind("getActiveTimer", async (_e: WebUI.Event) => {
  return JSON.stringify(await getActiveTimer());
});

async function startActiveTimer(entryId: string, taskName: string) {
  await kv.set(["activeTimer"], {
    id: entryId,
    start: (new Date()).toISOString(),
    name: taskName,
    stop: "",
  });
}

async function stopActive() {
  const activeTimer = (await kv.get<Timer>(["activeTimer"])).value;
  if (!activeTimer) return;
  await kv.atomic()
    .set(["activeTimer"], null)
    .set(["timers", activeTimer.id], {
      ...activeTimer,
      stop: (new Date()).toISOString(),
    }).commit();
}

async function timers() {
  const entries = await Array.fromAsync(kv.list<Timer>({ prefix: ["timers"] }));
  const timers: Timer[] = [];
  for (const entry of entries) {
    timers.push(entry.value!);
  }
  return timers;
}

async function deleteTimer(taskId: string) {
  await kv.delete(["timers", taskId]);
}

async function updateTimerName(entryId: string, name: string) {
  // get timer
  const timer = (await kv.get<Timer>(["timers", entryId])).value!;
  await kv.set(["timers", entryId], { ...timer, name });
}

////
async function getActiveTimer() {
  const activeTask = (await kv.get<string>(["activeTimer"])).value;
  return activeTask;
}

/////////////////// Projects
// save project

// getProject

// start / stop

// reports

// GetWeeklyReport
// per week, per projects

webui.setPort(8081);

if (Deno.env.get("DEV") === "true") {
  // For developing use the below
  //
  // Show a new window and point to our custom web server
  // Assuming the custom web server is running on port
  // 5173...
  await webui.showBrowser("http://localhost:5173/", WebUI.Browser.AnyBrowser);
} else {
  // use the build
  const index = await Deno.readTextFile("./client/build/index.html");
  await webui.show(index);
}

await WebUI.wait();
