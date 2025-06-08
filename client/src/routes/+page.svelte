<script lang="ts">
  import { Button, Input, Timepicker } from "flowbite-svelte";
  import {
    PlayOutline,
    StopOutline,
    TrashBinOutline,
  } from "flowbite-svelte-icons";

  import { format, isThisWeek, isToday, parse } from "date-fns";
  import { ulid } from "@std/ulid";
  import TimerDisplay from "./TimerDisplay.svelte";
  import { onMount } from "svelte";
  import { formatDay, formatDuration } from "./utils";
  import Duration from "./Duration.svelte";
  import EditableDiv from "./EditableDiv.svelte";
  import type { Timer } from "../types";

  let status = $state<Timer>({ id: "", name: "", start: "", stop: "" });

  let formatted = $derived(
    format(new Date(status.start), "dd/MM"),
  );

  const onActiveTimerTimeChange = (data?: { time: string }) => {
    console.log(data);
    if (data) {
      status.start = (parse(data.time, "HH:mm", new Date(status.start)))
        .toISOString();
    }
  };

  let listOfTimers: Timer[] = $state([]);

  onMount(async () => {
    const activeTask = JSON.parse(await webui.getActiveTimer());
    if (activeTask) {
      status = activeTask;
    }
    listOfTimers = JSON.parse(await webui.timers());
  });

  let tasksByDay = $derived.by(() => {
    const res: Record<string, Timer[]> = {};
    for (const task of listOfTimers) {
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
          tasks: (dt[1] as Timer[]).sort((a, b) =>
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
    if (status.start === "") {
      // start a new task
      const taskId = ulid();
      status.start = new Date().toISOString();
      status.id = taskId;

      await webui.startActiveTimer(taskId, status.name);
    } else {
      if (forceState === "start") return; // because forceState, not stopping
      await webui.stopActiveTimer();
      status = { start: "", id: "", name: "", stop: "" };
      listOfTimers = JSON.parse(await webui.timers());
    }
  };

  const onDeleteTimer = async (taskId: string) => {
    await webui.deleteTimer(taskId);
    listOfTimers = JSON.parse(await webui.timers());
  };

  const updateTimerName = async (taskId: string, newValue: string) => {
    await webui.updateTimerName(taskId, newValue);
    listOfTimers = JSON.parse(await webui.timers());
  };
</script>

<div class="p-2 w-full">
  <div class="flex space-x-2">
    <Input
      size="sm"
      bind:value={status.name}
      onKeydown={(e) => {
        if (e.key === "Enter") {
          onToggleStart("start");
        }
      }}
      placeholder="What are you working on?"
    />
    <TimerDisplay start={status.start} />
    <Button
      onclick={() => onToggleStart()}
      color={status.start === "" ? "green" : "red"}
    >
      {#if status.start === ""}
        <PlayOutline />
      {:else}
        <StopOutline />
      {/if}
    </Button>
  </div>

  <div class="flex py-2 justify-between items-center">
    <div class="bg-yellow-100 flex gap-2">
      {#if status.start !== ""}
        <div>
          {format(new Date(status.start), "dd/MM")}
        </div>
        <Timepicker
          value={format(new Date(status.start), "HH:mm")}
          onselect={onActiveTimerTimeChange}
          size="sm"
        />
      {/if}
    </div>
    <div class="flex gap-x-2 text-slate-700">
      <div class="flex">
        Today:&nbsp;<Duration duration={todayTotal} type="hourFractions" />h
      </div>
      <div class="text-xs" style="line-height: 2; color: gray">
        &#x1f534;&#xfe0e;
      </div>
      <div class="flex">
        This Week:&nbsp;<Duration
          duration={thisWeekTotal}
          type="hourFractions"
        />h
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
                  updateTimerName(taskForDay.id, newValue)}
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
                onclick={() => onDeleteTimer(taskForDay.id)}
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
