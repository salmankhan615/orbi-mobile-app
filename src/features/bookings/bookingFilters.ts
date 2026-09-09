import type { Booking, BookingKind } from '@/api/bookings';

export type BookingKindFilter = 'all' | BookingKind;

export interface BookingFilterOption {
  id: string;
  label: string;
}

export interface BookingStats {
  total: number;
  booked: number;
  cancelled: number;
}

export function computeBookingStats(bookings: Booking[]): BookingStats {
  let booked = 0;
  let cancelled = 0;
  for (const booking of bookings) {
    if (booking.status === 'cancelled') cancelled += 1;
    else booked += 1;
  }
  return { total: bookings.length, booked, cancelled };
}

export function filterBookingsByKind(bookings: Booking[], kind: BookingKindFilter): Booking[] {
  if (kind === 'all') return bookings;
  return bookings.filter((booking) => booking.kind === kind);
}

export function filterBookingsByCalendar(bookings: Booking[], calendarId: string): Booking[] {
  if (!calendarId || calendarId === 'all') return bookings;
  return bookings.filter((booking) => booking.calendarId === calendarId);
}

export function filterBookingsByShift(bookings: Booking[], shiftKey: string): Booking[] {
  if (!shiftKey || shiftKey === 'all') return bookings;
  return bookings.filter((booking) => (booking.shiftName ?? '').trim().toLowerCase() === shiftKey);
}

/** Full settings.categories list (ACCA, AAT, ACDAP, …) — not only booked ones. */
export function calendarFilterOptions(
  calendars: { id: string; name: string }[],
): BookingFilterOption[] {
  const items = calendars
    .filter((item) => item.id !== 'all')
    .map((item) => ({ id: item.id, label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return [{ id: 'all', label: 'All Calendars' }, ...items];
}

/** Dedupe by shift display name — CRM creates a Morning/Afternoon per location. */
export function shiftFilterOptions(bookings: Booking[]): BookingFilterOption[] {
  const seen = new Map<string, string>();
  for (const booking of bookings) {
    if (booking.kind !== 'training') continue;
    const label = (booking.shiftName ?? '').trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (!seen.has(key)) seen.set(key, label);
  }
  return [
    { id: 'all', label: 'All Shifts' },
    ...[...seen.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];
}
