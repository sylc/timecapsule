<script lang="ts">
  import { Button, Input } from "flowbite-svelte";
  import { format } from "date-fns";
  import { ulid } from "@std/ulid";
  import TimerDisplay from "./TimerDisplay.svelte";
  import { onMount } from "svelte";
  let status = $state({ started: 0, taskId: "", taskName: "" });
  let formatted = $derived(
    format(new Date(status.started), "dd/MM HH:MM aa"),
  );
  let taskName = $state("x");
  let listOfTasks: {
    id: string;
    name: string;
    start: string;
    stop: string;
  }[] = $state([]);

  onMount(async () => {
    listOfTasks = JSON.parse(await webui.tasks());
  });

  let tasksByDay = $derived.by(() => {
    return listOfTasks;
  });

  const onToggleStart = async () => {
    if (status.started === 0) {
      // start a new task
      const taskId = ulid();
      status.started = Date.now();
      status.taskId = taskId;

      await webui.startNewTask(taskId, taskName);
    } else {
      await webui.stopTask(status.taskId);
      status = { started: 0, taskId: "", taskName: "" };
      listOfTasks = JSON.parse(await webui.tasks());
    }
  };

  const onDeleteTask = async (taskId: string) => {
    await webui.deleteTask(taskId);
    listOfTasks = JSON.parse(await webui.tasks());
  };

  const updateName = async () => {
    // if timer is running, update the current name
    // if not running do nothing special.
  };
</script>

<div class="p-2">
  <h1 class="text-slate-700">Timer</h1>

  <div class="flex space-x-2">
    <Input size="sm" bind:value={taskName} onKeydown={updateName} />
    <Button onclick={onToggleStart}>{
      status.started === 0 ? "start" : "stop"
    }</Button>
  </div>

  <div class="flex py-2">
    <TimerDisplay start={status.started} />
    <div class="w-34 bg-yellow-100">
      {#if status.started !== 0}
        {formatted}
      {/if}
    </div>
  </div>
  <div>
    {#each tasksByDay as t}
      <div>
        {t.name} - {t.start} - {t.stop} - <Button
          onclick={() => onDeleteTask(t.id)}
        >delete</Button>
      </div>
    {/each}
  </div>
</div>
