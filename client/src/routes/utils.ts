import { format, getWeek, getYear } from "date-fns";

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

export const getWeekKey = () => {
  const today = new Date();
  const week = getWeek(today, { weekStartsOn: 1 });
  const year = getYear(today);
  return `${year}_${week}`;
};
