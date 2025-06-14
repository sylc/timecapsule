import type { Project } from "../types.ts";

export function keyBy<T>(array: T[], key: string): Record<string, T> {
  return array.reduce((obj, item) => {
    // @ts-expect-error // some error
    obj[item[key]] = item;
    return obj;
  }, {});
}

export const projects = $state<{ projects: Project[] }>({ projects: [] });
export const projectsByKey = () => {
  return keyBy<Project>(projects.projects, "id");
};

export const settings = $state<{ hoursPerDay: number; hoursPerWeek: number }>({
  hoursPerDay: 7.6,
  hoursPerWeek: 38,
});
