import { Project } from "../types.ts";

export const projects = $state<{ projects: Project[] }>({ projects: [] });
