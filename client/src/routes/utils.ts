import { addDays, format, getWeek, getYear, startOfWeek } from "date-fns";

export const formatDay = (dateString: string) => {
  try {
    return format(new Date(dateString), "hh:mm aa");
  } catch (e) {
    console.log(dateString, e);
  }
};

export const formatDuration = (
  startDateString: string,
  stopDateString: string,
) => {
  const duration = new Date(stopDateString).valueOf() -
    new Date(startDateString).valueOf();

  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 60 * 60));

  return { hours, minutes, seconds };
};

export const msToHours = (ms: number) => {
  return (ms / (1000 * 60 * 60)).toFixed(2);
};

export const getWeekKey = (
  opts?: { overrideDate?: string; format?: string },
) => {
  const today = opts?.overrideDate ? new Date(opts?.overrideDate) : new Date();
  const week = getWeek(today, { weekStartsOn: 1 });
  const year = getYear(today);
  const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
  const day1d = startOfWeekDate;
  const day2d = addDays(startOfWeekDate, 1);
  const day3d = addDays(startOfWeekDate, 2);
  const day4d = addDays(startOfWeekDate, 3);
  const day5d = addDays(startOfWeekDate, 4);
  const day6d = addDays(startOfWeekDate, 5);
  const day7d = addDays(startOfWeekDate, 6);

  let day1 = day1d.toISOString();
  let day2 = day2d.toISOString();
  let day3 = day3d.toISOString();
  let day4 = day4d.toISOString();
  let day5 = day5d.toISOString();
  let day6 = day6d.toISOString();
  let day7 = day7d.toISOString();

  if (opts?.format) {
    day1 = format(day1d, opts.format);
    day2 = format(day2d, opts.format);
    day3 = format(day3d, opts.format);
    day4 = format(day4d, opts.format);
    day5 = format(day5d, opts.format);
    day6 = format(day6d, opts.format);
    day7 = format(day7d, opts.format);
  }

  return {
    weekKey: `${year}_${week}`,
    day1d,
    day1,
    day2,
    day3,
    day4,
    day5,
    day6,
    day7,
  };
};
