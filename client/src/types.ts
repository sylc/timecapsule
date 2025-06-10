export interface Timer {
  id: string;
  name: string;
  start: string;
  stop: string;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface WeeklyByProjectReport {
  projectKey: string;
  msTotal: number;
  timers: Timer[];
  byDays: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
}
