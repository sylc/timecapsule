<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    start: string;
  }

  let { start }: Props = $props();
  let duration = $state(0);
  const formatted = $derived.by(() => {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor(duration / (1000 * 60 * 60));

    return { hours, minutes, seconds };
  });

  onMount(() => {
    let x = setInterval(() => {
      if (start === "") duration = 0;
      else duration = Date.now() - new Date(start).valueOf();
    }, 1000);
    return () => clearInterval(x);
  });
</script>

<div class="p-2">
  {formatted.hours.toFixed().padStart(2, "0")}:{
    formatted.minutes.toFixed().padStart(2, "0")
  }:{formatted.seconds.toFixed().padStart(2, "0")}
</div>
