<script lang="ts">
  import { Input, Button } from "flowbite-svelte"
    import TimerDisplay from "./TimerDisplay.svelte";
  let status = $state({started: 0})
  let taskName = $state('x')

  const onToggleStart = async () => {  
    if (status.started === 0) {
      status = { started: await webui.test_time() }
    } else {
      status = { started: 0 }
    }
  }

  const updateName = async () => {
    // if timer is running, update the current name
    // if not running do nothing special.
  }

</script>

<div class="p-2">

  <h1 class="text-slate-700">Timer</h1>
  
  <div class="flex space-x-2">
    <Input size="sm" 
      bind:value={taskName} 
      onKeydown={updateName}/>  
    <Button onclick={onToggleStart}>{status.started === 0 ? 'start' : "stop"}</Button>
  </div>
  
  <TimerDisplay start={status.started}/>
  <div>
    {status}
  </div>
</div>
