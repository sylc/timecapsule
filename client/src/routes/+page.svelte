<script lang="ts">
  let status = $state(true)
  const onToggleStart = async (e) => {
    // alert('whoushh!')
    // status = !status
   
    status = await webui.test_time()
  }
</script>

<h1>TimerCapsule</h1>

<input />

<button onclick={onToggleStart}>{status ? 'start' : "stop"}</button>
<div>hepp 
  {status}
</div>
