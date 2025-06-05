<script lang="ts">
  import { Input, Button } from "flowbite-svelte"
  let status = $state({started: 0})
  let taskName = $state('x')
  // onM

  const onToggleStart = async () => {  
    status = await webui.test_time()
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
    <Button onclick={onToggleStart}>{status ? 'start' : "stop"}</Button>
  </div>
  
  <div>
    {status}
  </div>
</div>
