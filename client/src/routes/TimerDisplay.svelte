<script lang="ts">
    import { onMount } from "svelte";

  let { start } = $props()
  let duration = $state(0)


  onMount(() => {
    let x = setInterval(() => {
      if (start === 0) duration = 0;
      else duration = Date.now() - start
    }, 1000)
  })
</script>

<div class="p-2">
  {duration}
</div>
