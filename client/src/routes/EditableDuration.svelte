<script lang="ts">
  import { Popover, Timepicker } from "flowbite-svelte";
  import Duration from "./Duration.svelte";
  import { formatDuration } from "./utils";
  import { format, parse } from "date-fns";

  interface Props {
    start: string;
    stop: string;
    onSubmit: (start: string, stop: string) => Promise<void>;
    id: string;
  }
  const { id, start, stop, onSubmit }: Props = $props();

  let selectedTimeRange = $state({
    time: format(new Date(start), "HH:mm"),
    endTime: format(new Date(stop), "HH:mm"),
  });

  let selectedTimeRangeFullDate = $derived.by(() => {
    return {
      time: parse(selectedTimeRange.time, "HH:mm", new Date(start))
        .toISOString(),
      endTime: parse(selectedTimeRange.endTime, "HH:mm", new Date(stop))
        .toISOString(),
    };
  });

  function handleRangeChange(
    data: { time: string; endTime: string; [key: string]: string },
  ): void {
    if (data) {
      selectedTimeRange = {
        time: data.time,
        endTime: data.endTime,
      };
    }
  }

  function onClose(e: ToggleEvent) {
    console.log(e);
    if (e.newState === "closed") {
      onSubmit(
        selectedTimeRangeFullDate.time,
        selectedTimeRangeFullDate.endTime,
      );
    }
  }

  let showInput = $state(false);
</script>

<div class="">
  <div
    id={"t-" + id}
    onclick={() => {
      showInput = true;
    }}
    class="hover:bg-slate-200 hover:font-semibold px-2 rounded-md"
  >
    <Duration duration={formatDuration(start, stop)}> </Duration>
  </div>
  <Popover
    class="text-sm font-light"
    title="Popover title"
    triggeredBy={`#t-${id}`}
    trigger="click"
    placement="bottom"
    ontoggle={onClose}
  >
    <Duration
      duration={formatDuration(
        selectedTimeRangeFullDate.time,
        selectedTimeRangeFullDate.endTime,
      )}
    >
    </Duration>
    <Timepicker
      type="range"
      onselect={handleRangeChange}
      value={selectedTimeRange.time}
      endValue={selectedTimeRange.endTime}
    />
  </Popover>
</div>
