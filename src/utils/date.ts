/** Local calendar day `YYYY-MM-DD` (not UTC — matches ORBI CRM date params). */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

/** Long display date from an ISO day, e.g. Monday · 14 September 2026. */
export function formatHeroDate(iso: string): { weekday: string; rest: string } {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { weekday: '', rest: iso };
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
    rest: date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

/** Portal-style date label, e.g. 13/10/2026. */
export function formatPortalDate(value: string | Date | undefined | null): string {
  if (!value) return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * 24-hour clock, e.g. 13:00 or 18:30.
 * Accepts ISO datetimes, `HH:mm`, or leftover 12-hour `10:00 AM` values.
 */
export function formatClock(value: unknown, empty = '—'): string {
  if (value == null) return empty;
  const raw = String(value).trim();
  if (!raw) return empty;

  const ampm = raw.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])/);
  if (ampm) {
    let hour = Number(ampm[1]) % 12;
    if (ampm[3].toUpperCase() === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${ampm[2]}`;
  }

  const iso = raw.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;

  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;

  return raw;
}

/** Portal-style 24h clock, e.g. 14:00. */
export function formatPortalTime(time: string | undefined | null): string {
  return formatClock(time, '—');
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/** Inclusive ISO day window around today — used by My Bookings / home bootstrap. */
export function getRollingDateRange(
  monthsBack: number,
  monthsAhead: number,
): { startDate: string; endDate: string } {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  start.setMonth(start.getMonth() - monthsBack);
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  end.setMonth(end.getMonth() + monthsAhead);
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

/** First/last day of the month containing `date` (local). */
export function getMonthDateRange(date: Date): { startDate: string; endDate: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

/**
 * Shared fetch window for Month/Week/List. Always the 6-week month grid so
 * switching views does not refetch, and week days at month edges still have data.
 */
export function getVisibleCalendarRange(cursor: Date): { startDate: string; endDate: string } {
  const days = getMonthGrid(cursor.getFullYear(), cursor.getMonth());
  return { startDate: days[0].iso, endDate: days[days.length - 1].iso };
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
 * Combines an ISO date ('2026-08-04') with a 24-hour clock ('13:00')
 * or leftover 12-hour value ('10:00 AM') into a Date.
 */
export function combineDateAndTime(isoDate: string, time: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  const clock = formatClock(time, '');
  const match = clock.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return new Date(year, month - 1, day);
  return new Date(year, month - 1, day, Number(match[1]), Number(match[2]));
}
