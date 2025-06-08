<script lang="ts">
  interface Props {
    duration: {
      hours: number;
      minutes: number;
      seconds: number;
    } | number;

    type?: "hourFractions";
  }
  const { duration, type }: Props = $props();

  const durationUnified = $derived.by(() => {
    if (typeof duration !== "number") {
      return { ...duration, hourFractions: "TBD" };
    }
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const hourFractions = (duration / (1000 * 60 * 60)).toFixed(2);
    return { hours, minutes, seconds, hourFractions };
  });
</script>

{#if type === "hourFractions"}
  <div>
    {durationUnified.hourFractions}
  </div>
{:else}
  <div>
    {durationUnified.hours.toFixed().padStart(2, "0")}:{
      durationUnified.minutes.toFixed().padStart(2, "0")
    }:{durationUnified.seconds.toFixed().padStart(2, "0")}
  </div>
{/if}
