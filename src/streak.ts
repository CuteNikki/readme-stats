import type { Day } from './github';

export interface Run {
  length: number;
  start?: string;
  end?: string;
}

export interface Streaks {
  current: Run;
  longest: Run;
  total: number;
}

/**
 * Days in a row with at least one contribution. Today not having any yet
 * doesn't end the current streak: the day isn't over.
 */
export function streaks(days: Day[]): Streaks {
  let longest: Run = { length: 0 };
  let run: Run = { length: 0 };
  let total = 0;
  for (const day of days) {
    total += day.count;
    if (day.count > 0) {
      run = { length: run.length + 1, start: run.start ?? day.date, end: day.date };
      if (run.length > longest.length) longest = run;
    } else {
      run = { length: 0 };
    }
  }

  const last = days.at(-1);
  const today = new Date().toISOString().slice(0, 10);
  let current = run;
  if (last && last.date === today && last.count === 0) {
    // The run that ended yesterday
    current = { length: 0 };
    for (let i = days.length - 2; i >= 0 && days[i]!.count > 0; i--)
      current = { length: current.length + 1, start: days[i]!.date, end: current.end ?? days[i]!.date };
  }
  return { current, longest, total };
}
