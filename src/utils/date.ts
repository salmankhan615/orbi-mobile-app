export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isSameDay(isoDate: string, date: Date): boolean {
  return isoDate === toISODate(date);
}

export interface MonthDay {
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
}

// Builds a 6-week (42-cell) grid for the given month, starting on Sunday,
// including the leading/trailing days from adjacent months to fill the grid.
export function getMonthGrid(year: number, month: number): MonthDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      iso: toISODate(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/**
 * Combines an ISO date ('2026-08-04') with a 12-hour clock time
 * ('10:00 AM') into a real Date — used to build calendar events from
 * session mock data.
 */
export function combineDateAndTime(isoDate: string, time: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

  if (!match) return new Date(year, month - 1, day);

  const [, hourStr, minuteStr, meridiem] = match;
  let hour = Number(hourStr) % 12;
  if (meridiem.toUpperCase() === 'PM') hour += 12;

  return new Date(year, month - 1, day, hour, Number(minuteStr));
}
