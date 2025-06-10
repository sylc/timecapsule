<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { onMount } from "svelte";
  import type { WeeklyByProjectReport } from "../../types";
  import { projects, projectsByKey } from "../states.svelte";
  import { getWeekKey, msToHours } from "../utils";

  let weeklyReport: Record<string, WeeklyByProjectReport[]> = $state({});
  const days = $state({
    weekKey: getWeekKey(),
    day1: "Mon",
    day2: "Tue",
    day3: "Wed",
    day4: "thu",
    day5: "Fri",
    day6: "Sat",
    day7: "Sun",
  });

  let selectedProjectData = $derived.by(() => {
    return (weeklyReport[days.weekKey as string] || []);
  });

  const getProjectName = (projectKey: string) => {
    return projectsByKey()[projectKey]?.name || "No Project";
  };

  onMount(async () => {
    const currentWeekKey = getWeekKey();
    weeklyReport = JSON.parse(
      await webui.getByWeeklyAndProjects(currentWeekKey),
    );
  });
</script>

<div>Week {getWeekKey().split("_")[1]}</div>
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
          <TableBodyCell>{msToHours(proj.msTotal)}h</TableBodyCell>
          <TableBodyCell>{msToHours(proj.byDays[0])}h</TableBodyCell>
          <TableBodyCell>{msToHours(proj.byDays[1])}h</TableBodyCell>
          <TableBodyCell>{msToHours(proj.byDays[2])}h</TableBodyCell>
          <TableBodyCell>{msToHours(proj.byDays[3])}h</TableBodyCell>
          <TableBodyCell>{msToHours(proj.byDays[4])}h</TableBodyCell>
          <TableBodyCell>{msToHours(proj.byDays[5])}h</TableBodyCell>
          <TableBodyCell>{msToHours(proj.byDays[6])}h</TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
