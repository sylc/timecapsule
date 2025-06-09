<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";

  let { children } = $props();

  const isActive = (path: string) => {
    if (page.url.pathname === path) return true;
    return false;
  };
</script>

<div class="bg-violet-100 min-h-svh">
  <ul class="flex gap-x-2 p-2 bg-white">
    <li
      class={`px-2 rounded-md ${
        isActive("/") ? "bg-amber-400 text-white font-semibold" : ""
      }`}
    >
      <a href="/">Timer</a>
    </li>
    <li
      class={`px-2 rounded-md ${
        isActive("/projects")
          ? "bg-amber-400 text-white font-semibold"
          : ""
      }`}
    >
      <a href="/projects">Projects</a>
    </li>
    <li
      class={`px-2 rounded-md ${
        isActive("/reports")
          ? "bg-amber-400 text-white font-semibold"
          : ""
      }`}
    >
      <a href="/reports">Reports</a>
    </li>
  </ul>

  {@render children()}
</div>
