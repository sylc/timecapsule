<script lang="ts">
  import { Button, Input } from "flowbite-svelte";
  import {
    PlayOutline,
    StopOutline,
    TrashBinOutline,
  } from "flowbite-svelte-icons";

  import { format, isThisWeek, isToday } from "date-fns";
  import { ulid } from "@std/ulid";
  import TimerDisplay from "./TimerDisplay.svelte";
  import { onMount } from "svelte";
  import { formatDay, formatDuration } from "./utils";
  import Duration from "./Duration.svelte";
  import EditableDiv from "./EditableDiv.svelte";
  let status = $state({ started: 0, taskId: "", taskName: "" });
  let formatted = $derived(
    format(new Date(status.started), "dd/MM HH:MM aa"),
  );

  interface Task {
    id: string;
    name: string;
    start: string;
    stop: string;
  }

  let listOfTasks: Task[] = $state([]);

  onMount(async () => {
    listOfTasks = JSON.parse(await webui.tasks());
  });

  let tasksByDay = $derived.by(() => {
    const res: Record<string, Task[]> = {};
    for (const task of listOfTasks) {
      // get day
      const day = format(new Date(task.start), "yyyy/MM/dd");
      if (!res[day]) res[day] = [];
      res[day].push(task);
    }
    return Object.entries(res)
      .sort((a, b) => a[0].localeCompare(b[0]))
      // sort task in each days
      .map((dt) => {
        return {
          day: dt[0],
          tasks: (dt[1] as Task[]).sort((a, b) =>
            b.start.localeCompare(a.start)
          ),
        };
      });
  });

  const todayTotal = $derived.by(() => {
    if (tasksByDay.length > 0 && isToday(new Date(tasksByDay[0].day))) {
      return tasksByDay[0].tasks.reduce(
        (acc, cur) =>
          acc +
          (new Date(cur.stop).valueOf() - new Date(cur.start).valueOf()),
        0,
      );
    }
    return 0;
  });
  const thisWeekTotal = $derived.by(() => {
    let total = 0;
    for (const tDay of tasksByDay) {
      if (isThisWeek(new Date(tDay.day), { weekStartsOn: 1 })) {
        const dayTotal = tasksByDay[0].tasks.reduce(
          (acc, cur) =>
            acc +
            (new Date(cur.stop).valueOf() - new Date(cur.start).valueOf()),
          0,
        );
        total = total + dayTotal;
      }
    }
    return total;
  });

  const onToggleStart = async (forceState?: "start" | "stop") => {
    if (status.started === 0) {
      // start a new task
      const taskId = ulid();
      status.started = Date.now();
      status.taskId = taskId;

      await webui.startNewTask(taskId, status.taskName);
    } else {
      if (forceState === "start") return; // becuase forceState, not stopping
      await webui.stopTask(status.taskId);
      status = { started: 0, taskId: "", taskName: "" };
      listOfTasks = JSON.parse(await webui.tasks());
    }
  };

  const onDeleteTask = async (taskId: string) => {
    await webui.deleteTask(taskId);
    listOfTasks = JSON.parse(await webui.tasks());
  };

  const updateTaskName = async (taskId: string, newValue: string) => {
    await webui.updateTaskName(taskId, newValue);
    listOfTasks = JSON.parse(await webui.tasks());
  };
</script>

<div class="p-2 w-full">
  <h1 class="text-slate-700">Timer</h1>

  <div class="flex space-x-2">
    <Input
      size="sm"
      bind:value={status.taskName}
      onKeydown={(e) => {
        if (e.key === "Enter") {
          onToggleStart("start");
        }
      }}
      placeholder="What are you working on?"
    />
    <TimerDisplay start={status.started} />
    <Button
      onclick={() => onToggleStart()}
      color={status.started === 0 ? "green" : "red"}
    >
      {#if status.started === 0}
        <PlayOutline />
      {:else}
        <StopOutline />
      {/if}
    </Button>
  </div>

  <div class="flex py-2 justify-between items-center">
    <div class="w-34 bg-yellow-100">
      {#if status.started !== 0}
        {formatted}
      {/if}
    </div>
    <div class="flex gap-x-2 text-slate-700">
      <div class="flex">
        Today:&nbsp;<Duration duration={todayTotal} type="hourFractions" />
      </div>
      <div class="text-xs" style="line-height: 2; color: gray">
        &#x1f534;&#xfe0e;
      </div>
      <div class="flex">
        This Week:&nbsp;<Duration
          duration={thisWeekTotal}
          type="hourFractions"
        />
      </div>
    </div>
  </div>
  <div>
    <div></div>
    <hr />
    {#each tasksByDay as tDay}
      <div class="font-semibold text-slate-700 text-sm">
        {format(new Date(tDay.day), "dd-MMM")}
      </div>
      <div class="flex flex-col gap-y-1">
        {#each tDay.tasks as taskForDay}
          <div class="flex gap-x-2 justify-between border-t-1 border-slate-300 py-1">
            <div class="flex grow-1">
              <div class="grow-1">
                <EditableDiv
                  text={taskForDay.name}
                  onSubmit={(newValue) =>
                  updateTaskName(taskForDay.id, newValue)}
                  withPencil="hover"
                />
                <div>
                  {formatDay(taskForDay.start)}
                  - {formatDay(taskForDay.stop)}
                </div>
              </div>
              <Duration
                duration={formatDuration(taskForDay.start, taskForDay.stop)}
              ></Duration>
            </div>
            <div>
              <Button
                onclick={() => onDeleteTask(taskForDay.id)}
                size="xs"
                class="flex-end"
              >
                <TrashBinOutline size="xs" />
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>
