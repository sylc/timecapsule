<script lang="ts">
  interface Props {
    duration: {
      hours: number;
      minutes: number;
      seconds: number;
    } | number;
  }
  const { duration }: Props = $props();

  const durationUnified = $derived.by(() => {
    if (typeof duration !== "number") return duration;
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor(duration / (1000 * 60 * 60));

    return { hours, minutes, seconds };
  });
</script>

<div>
  {durationUnified.hours.toFixed().padStart(2, "0")}:{
    durationUnified.minutes.toFixed().padStart(2, "0")
  }:{durationUnified.seconds.toFixed().padStart(2, "0")}
</div>
