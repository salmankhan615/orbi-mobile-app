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

/** Portal-style date label, e.g. 13/10/2026. */
export function formatPortalDate(value: string | Date | undefined | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const iso = String(value).slice(0, 10);
    const [year, month, day] = iso.split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
    return '—';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/** First/last day of the month containing `date` (local). */
export function getMonthDateRange(date: Date): { startDate: string; endDate: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

/** Visible fetch window for calendar Month/Week/List modes. */
export function getVisibleCalendarRange(
  cursor: Date,
  viewMode: 'Month' | 'Week' | 'List',
): { startDate: string; endDate: string } {
  if (viewMode === 'Week') {
    const { start, end } = getWeekRange(cursor);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }
  return getMonthDateRange(cursor);
}

export function getWeekDays(anchor: Date): MonthDay[] {
  const { start } = getWeekRange(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      iso: toISODate(date),
      isCurrentMonth: date.getMonth() === anchor.getMonth(),
    };
  });
}

export function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
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
