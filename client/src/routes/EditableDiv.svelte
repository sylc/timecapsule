<script lang="ts">
  import { PenOutline } from "flowbite-svelte-icons";

  let {
    text,
    onSubmit,
    withPencil,
    disabled,
  }: {
    text: string;
    onSubmit: (newValue: string) => Promise<void>;
    withPencil?: "static" | "hover";
    disabled?: boolean;
  } = $props();

  let showInput = $state(false);
  let newValue = $state(text);

  const onblur = () => {
    // save value in db
    if (newValue.length > 0 && newValue !== text) onSubmit(newValue);
    showInput = false;
  };

  function onKeyup(
    e: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    if (e.key === "Escape") {
      // reset value
      newValue = text;
      // exit
      e.currentTarget.blur();
      return;
    }
    newValue = e.currentTarget.value;
    if (e.currentTarget.value !== "" && e.key === "Enter") {
      e.currentTarget.blur();
    }
  }
</script>

<div class="">
  {#if showInput}
    <input
      onkeyup={onKeyup}
      class="border-purple-600 border-b-2 outline-hidden px-2"
      value={newValue}
      {onblur}
      autofocus
    >
  {:else}
    <div
      onclick={() => {
        if (!disabled) {
          showInput = true;
          newValue = text;
        }
      }}
      class="flex flex-row align-center group"
    >
      <div>{text}</div>
      {#if withPencil === "static"}
        <div class="my-auto pl-2"><PenOutline /></div>
      {/if}
      {#if withPencil === "hover"}
        <div class="my-auto pl-2 invisible group-hover:visible">
          <PenOutline />
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  input {
    outline-width: 0px;
  }
</style>
