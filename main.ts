import { WebUI } from "jsr:@webui/deno-webui";
import { ulid } from "jsr:@std/ulid";
import { addDays, endOfWeek, getDay, getWeek, getYear } from "npm:date-fns";
import type {
  Project,
  Timer,
  WeeklyByProjectReport,
} from "./client/src/types.ts";
// import { upgrade } from "./upgrade.ts";
import { sliceIntoBatches } from "./utils.ts";

export const index_timers_by_start_date = "timers_by_start_date";
export const compositeKeyStart = (timer: { start: string; id: string }) => {
  return `${timer.start}__${timer.id}`;
};

const webui = new WebUI();
WebUI.setFolderMonitor(true);
webui.setRootFolder("./client/build");

Deno.mkdirSync("./.tak", { recursive: true });
const kv = await Deno.openKv("./.tak/db");
// await upgrade(kv);

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
  await kv.atomic()
    .set(["activeTimer"], {
      id: entryId,
      start: (new Date()).toISOString(),
      name: taskName,
      stop: "",
    })
    .commit();
}

// when the active timer is stopped, it is copied over to
// the timers index
async function stopActive() {
  const activeTimer = (await kv.get<Timer>(["activeTimer"])).value;
  if (!activeTimer) return;
  await kv.atomic()
    .set(["activeTimer"], null)
    .set(["timers", activeTimer.id], {
      ...activeTimer,
      stop: (new Date()).toISOString(),
    })
    .set(
      [
        index_timers_by_start_date,
        compositeKeyStart({ start: activeTimer.start, id: activeTimer.id }),
      ],
      activeTimer.id,
    ).commit();
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
  await kv.atomic()
    .delete(["timers", timerId])
    .delete(
      [
        index_timers_by_start_date,
        compositeKeyStart(timer),
      ],
    ).commit();
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
  const timerUpdated = { ...timer, start, stop };
  await kv.atomic()
    .set(["timers", timerId], timerUpdated)
    .commit();

  // updating index
  if (timer.start !== start) {
    await kv.atomic()
      .delete([index_timers_by_start_date, compositeKeyStart(timer)])
      .set(
        [index_timers_by_start_date, compositeKeyStart(timerUpdated)],
        timerId,
      )
      .commit();
  }
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

// limited to the last 500.
// todo this is not great. we should have an index by start time;
async function timers(opts?: { startOfWeekDay: string }) {
  const start = [
    index_timers_by_start_date,
    (addDays(new Date(), -21)).toISOString(),
  ];
  const end = [index_timers_by_start_date, "5000"];

  if (opts?.startOfWeekDay) {
    // get the startDate of the week.
    start[1] = opts?.startOfWeekDay;
    // get the endDate of teh week
    end[1] = endOfWeek(new Date(opts?.startOfWeekDay), { weekStartsOn: 1 })
      .toISOString();
  }

  const timerIds = await Array.fromAsync(
    kv.list<string>({ start, end }, { reverse: true }),
  );

  const timersBatches = sliceIntoBatches(timerIds, 8);
  let entries: Deno.KvEntryMaybe<Timer>[] = [];
  for (const batch of timersBatches) {
    entries = entries.concat(
      await kv.getMany<Timer[]>(
        batch.map((id) => ["timers", id.value]),
      ),
    );
  }

  const timers: Timer[] = [];
  for (const entry of entries) {
    entry.value && timers.push(entry.value);
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
webui.bind("getByWeeklyAndProjects", async (e: WebUI.Event) => {
  const startOfWeek = e.arg.string(0);
  return JSON.stringify(await getByWeeklyAndProjects(startOfWeek));
});

async function getByWeeklyAndProjects(startOfWeek: string) {
  // found timers for last week. then separate by projects then accumulate by day
  const timersList = await timers({ startOfWeekDay: startOfWeek });
  const accumulated: Record<
    string,
    Record<
      string,
      WeeklyByProjectReport
    >
  > = {}; // shape is { weekKey: { projectKey : { projectKey, durationTotal, tasks: [], durationDays: [ day1, day2, day2, day4, day5, day5, day7 ] } } }
  for (const timer of timersList) {
    const startDate = new Date(timer.start);
    const stopDate = new Date(timer.stop);
    //calculate duration
    const duration = stopDate.valueOf() - startDate.valueOf();
    const week = getWeek(startDate, { weekStartsOn: 1 });
    const year = getYear(startDate);
    const weekKey = `${year}_${week}`;
    if (!accumulated[weekKey]) accumulated[weekKey] = {};
    const projectKey = timer.projectId || "NO_PROJECT";
    if (!accumulated[weekKey][projectKey]) {
      accumulated[weekKey][projectKey] = {
        projectKey,
        msTotal: 0,
        timers: [],
        byDays: [0, 0, 0, 0, 0, 0, 0],
      };
    }
    accumulated[weekKey][projectKey].msTotal += duration;
    accumulated[weekKey][projectKey].timers.push(timer);
    // get the Day of the week
    const dayOfWeek = getDay(startDate) || 7; // sunday is zero, so becomes 7
    accumulated[weekKey][projectKey].byDays[dayOfWeek - 1] += duration;
  }

  const res: Record<
    string,
    WeeklyByProjectReport[]
  > = {};
  for (const weekKey in accumulated) {
    res[weekKey] = Object.values(accumulated[weekKey]);
  }
  return res;
}

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
