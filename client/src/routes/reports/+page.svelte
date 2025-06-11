<script lang="ts">
  import {
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { onMount } from "svelte";
  import type { WeeklyByProjectReport } from "../../types";
  import { projectsByKey } from "../states.svelte";
  import { getWeekKey, msToHours } from "../utils";
  import {
    ArrowLeftOutline,
    ArrowRightOutline,
  } from "flowbite-svelte-icons";
  import { addDays } from "date-fns";

  let weeklyReport: Record<string, WeeklyByProjectReport[]> = $state({});
  let days = $state({
    ...getWeekKey({ format: "EEE dd/MM" }),
  });

  let selectedProjectData = $derived.by(() => {
    return (weeklyReport[days.weekKey as string] || []);
  });

  const getProjectName = (projectKey: string) => {
    return projectsByKey()[projectKey]?.name || "No Project";
  };

  onMount(async () => {
    weeklyReport = JSON.parse(
      await webui.getByWeeklyAndProjects(days.day1d.toISOString()),
    );
  });

  const onPreviousWeek = async () => {
    days = {
      ...getWeekKey({
        overrideDate: addDays(days.day1d, -7).toISOString(),
        format: "EEE dd/MM",
      }),
    };
    weeklyReport = JSON.parse(
      await webui.getByWeeklyAndProjects(days.day1d.toISOString()),
    );
  };

  const onNextWeek = async () => {
    days = {
      ...getWeekKey({
        overrideDate: addDays(days.day1d, 7).toISOString(),
        format: "EEE dd/MM",
      }),
    };
    weeklyReport = JSON.parse(
      await webui.getByWeeklyAndProjects(days.day1d.toISOString()),
    );
  };
</script>

<div class="flex p-2 align-middle items-center">
  <Button class="p-2" onclick={onPreviousWeek}><ArrowLeftOutline
      class="h-6 w-6"
    /></Button>
  <div class="px-2">
    Week {days.weekKey.split("_")[1]}: {days.day1} - {days.day7}
  </div>
  <Button class="p-2" onclick={onNextWeek}><ArrowRightOutline
      class="h-6 w-6"
    /></Button>
</div>
<div>
  <Table>
    <TableHead>
      <TableHeadCell>Project</TableHeadCell>
      <TableHeadCell>total</TableHeadCell>
      <TableHeadCell>{days.day1}</TableHeadCell>
      <TableHeadCell>{days.day2}</TableHeadCell>
      <TableHeadCell>{days.day3}</TableHeadCell>
      <TableHeadCell>{days.day4}</TableHeadCell>
      <TableHeadCell>{days.day5}</TableHeadCell>
      <TableHeadCell>{days.day6}</TableHeadCell>
      <TableHeadCell>{days.day7}</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each selectedProjectData as proj}
        <TableBodyRow>
          <TableBodyCell>{getProjectName(proj.projectKey)}</TableBodyCell>

          {@render row(proj.msTotal)}
          {@render row(proj.byDays[0])}
          {@render row(proj.byDays[1])}
          {@render row(proj.byDays[2])}
          {@render row(proj.byDays[3])}
          {@render row(proj.byDays[4])}
          {@render row(proj.byDays[5])}
          {@render row(proj.byDays[6])}
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>

{#snippet row(ms: number)}
  <TableBodyCell class={ms > 0 ? "font-bold text-black" : ""}>{
      msToHours(ms)
    }h</TableBodyCell>
{/snippet}
