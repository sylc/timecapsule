import { WebUI } from "jsr:@webui/deno-webui";
import { ulid } from "jsr:@std/ulid";
import type { Project, Timer } from "./client/src/types.ts";

const webui = new WebUI();
WebUI.setFolderMonitor(true);
webui.setRootFolder("./client/build");

Deno.mkdirSync("./.tak", { recursive: true });
const kv = await Deno.openKv("./.tak/db");

// Active timer
webui.bind("startActiveTimer", async (e: WebUI.Event) => {
  console.log(e.arg.string(0), e.arg.string(1));
  await startActiveTimer(e.arg.string(0), e.arg.string(1));
});

webui.bind("stopActiveTimer", async () => {
  return JSON.stringify(await stopActive());
});

webui.bind("updateActiveTimerStart", async (e: WebUI.Event) => {
  const start = e.arg.string(0);
  console.log("update active timer start", start);

  const timer = (await kv.get<Timer>(["activeTimer"])).value!;
  await kv.set(["activeTimer"], { ...timer, start });
});

webui.bind("getActiveTimer", async (_e: WebUI.Event) => {
  const activeTask = (await kv.get<string>(["activeTimer"])).value;
  return JSON.stringify(activeTask);
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

////////////////////////////////////////////////////
// Generic timers
webui.bind("timers", async (_e: WebUI.Event) => {
  return JSON.stringify(await timers());
});

webui.bind("deleteTimer", async (e: WebUI.Event) => {
  const timerId = e.arg.string(0);
  console.log("deleting", timerId);

  const timer = (await kv.get<Timer>(["timers", timerId])).value!;
  if (timer.projectId) {
    console.log("removing from project", timer.projectId);
    await kv.delete(["projects", timer.projectId, "timers", timer.id]);
  }
  await kv.delete(["timers", timerId]);
  return JSON.stringify(await timers());
});

webui.bind("updateTimerName", async (e: WebUI.Event) => {
  const timerId = e.arg.string(0);
  const newName = e.arg.string(1);
  console.log("update timer Name", timerId, newName);

  const timer = (await kv.get<Timer>(["timers", timerId])).value!;
  await kv.set(["timers", timerId], { ...timer, name });
});

webui.bind("setTimerRange", async (e: WebUI.Event) => {
  const timerId = e.arg.string(0);
  const start = e.arg.string(1);
  const stop = e.arg.string(2);
  console.log("set timer range", timerId, start, stop);

  const timer = (await kv.get<Timer>(["timers", timerId])).value!;
  await kv.atomic()
    .set(["timers", timerId], { ...timer, start, stop })
    .commit();
});

webui.bind("setProject", async (e: WebUI.Event) => {
  const timerId = e.arg.string(0);
  const projectId = e.arg.string(1);
  console.log("Assign project", timerId, projectId);

  const timer = (await kv.get<Timer>(["timers", timerId])).value!;
  const oldProjectId = timer.projectId || "NO_PROJECT";
  await kv.atomic()
    .set(["timers", timerId], { ...timer, projectId })
    .delete(["projects", oldProjectId, "timers", timerId])
    .set(["projects", projectId, "timers", timerId], { ...timer, projectId })
    .commit();
});

async function timers() {
  const entries = await Array.fromAsync(kv.list<Timer>({ prefix: ["timers"] }));
  const timers: Timer[] = [];
  for (const entry of entries) {
    timers.push(entry.value!);
  }
  return timers;
}

/////////////////// Projects
// save project
webui.bind("createProject", async (e: WebUI.Event) => {
  const name = e.arg.string(0);
  const id = ulid();
  await kv.set(["projects", id], { id, name });
});

webui.bind("updateProjectName", async (e: WebUI.Event) => {
  const id = e.arg.string(0);
  const name = e.arg.string(1);
  await kv.set(["projects", id], { id, name });
});

// getProjects
webui.bind("projects", async (_e: WebUI.Event) => {
  const entries = await Array.fromAsync(
    kv.list<Project>({ prefix: ["projects"] }),
  );
  const projects: Project[] = [];
  for (const entry of entries) {
    if (entry.key.length > 2) continue; // keys like [projects, "abc", timers, "abe"] will be skipped.
    projects.push(entry.value!);
  }
  return JSON.stringify(projects);
});

//// TBD reports
// GetWeeklyReport
//
// per week, per projects
//

//////

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
