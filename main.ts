import { WebUI } from "jsr:@webui/deno-webui";

const webui = new WebUI();
WebUI.setFolderMonitor(true);
webui.setRootFolder("./client/build");

Deno.mkdirSync("./.tak", { recursive: true });
const kv = await Deno.openKv("./.tak/db");

// tasks
webui.bind("startNewTask", async (e: WebUI.Event) => {
  console.log(e.arg.string(0), e.arg.string(1));
  await startNewTask(e.arg.string(0), e.arg.string(1));
});

webui.bind("stopTask", async (e: WebUI.Event) => {
  console.log(e.arg.string(0));
  return JSON.stringify(await stop(e.arg.string(0)));
});

webui.bind("tasks", async (_e: WebUI.Event) => {
  return JSON.stringify(await tasks());
});

webui.bind("deleteTask", async (e: WebUI.Event) => {
  const taskId = e.arg.string(0);
  console.log("deleting", taskId);
  await deleteTask(taskId);
  return JSON.stringify(await tasks());
});

webui.bind("updateTaskName", async (e: WebUI.Event) => {
  const taskId = e.arg.string(0);
  const newName = e.arg.string(1);
  console.log("update taskName", taskId, newName);
  await updateTaskName(taskId, newName);
});

async function startNewTask(entryId: string, taskName: string) {
  await setActiveTask(entryId);
  await kv.atomic()
    .set(["entries", entryId, "start"], (new Date()).toISOString())
    .set(["entries", entryId, "name"], taskName)
    .commit();
}

async function stop(entryId: string) {
  await clearActiveTask();
  await kv.set(["entries", entryId, "stop"], (new Date()).toISOString());
}

async function tasks() {
  const entries = await Array.fromAsync(kv.list({ prefix: ["entries"] }));
  const tasks: Record<string, any> = {};
  for (const entry of entries) {
    const key = entry.key[1].toString();
    const action = entry.key[2].toString();
    if (!tasks[key]) tasks[key] = { id: key, name: "", start: "", stop: "" };
    tasks[key][action] = entry.value;
  }

  return Object.values(tasks);
}

async function deleteTask(taskId: string) {
  const entries = await Array.fromAsync(
    kv.list({ prefix: ["entries", taskId] }),
  );
  for (const entry of entries) {
    await kv.delete(entry.key);
  }
}

async function updateTaskName(entryId: string, name: string) {
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
