import { Timer } from "./client/src/types.ts";
import { compositeKeyStart, index_timers_by_start_date } from "./main.ts";

export const upgrade = async (kv: Deno.Kv) => {
  // get all timers
  const entries = await Array.fromAsync(
    kv.list<Timer>({ prefix: ["timers"] }),
  );
  const timers: Timer[] = [];
  for (const entry of entries) {
    timers.push(entry.value!);
    const indexValue = (await kv.get([
      index_timers_by_start_date,
      compositeKeyStart(entry.value!),
    ])).value;

    if (!indexValue) {
      console.log(
        "** Inserting",
        entry.value.name,
        entry.value.start,
        entry.value.id,
      );
      await kv.set([
        index_timers_by_start_date,
        compositeKeyStart(entry.value!),
      ], entry.value.id);
      // creating it.
    } else {
      console.log("ok for", entry.value.name, entry.value.id);
    }
  }
};
