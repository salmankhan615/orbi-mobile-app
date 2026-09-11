import type { BadgeTone } from '@/components/ui/Badge';
import {
  getAllocatedCourses,
  getClassCalendar,
  getCalendarUsersLite,
  getCourseSettings,
  getPracticalTrainingCalendar,
} from '@/api/crm';
import { collectAllocatedCalendarScope } from '@/features/calendar/allocatedScope';
import { requireStudentContext, requireUserId } from '@/api/sessionUser';
import { toISODate } from '@/utils/date';

export type SessionType = 'green' | 'red' | 'amber' | 'blue';
export type SessionStatus = 'upcoming' | 'completed' | 'cancelled';

export interface SessionAttachment {
  id: string;
  name: string;
  sizeLabel: string;
}

export interface SessionMyBooking {
  seat?: number;
  status?: string;
  attendance?: string;
}

export interface Session {
  id: string;
  calendarId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  code: string;
  type: SessionType;
  status: SessionStatus;
  instructor: string;
  mode: 'Online' | 'In-Person';
  description: string;
  attachments: SessionAttachment[];
  joinUrl?: string;
  location?: string;
  seatsLeft: number;
  /** Free seat numbers for the confirm-booking picker (slim calendar). */
  availableSeats?: number[];
  myBooking?: SessionMyBooking | null;
  bookingLimit?: number;
  activeBookingsCount?: number;
  classTypeId?: string;
  /** Practical training vs theory class. */
  kind?: 'class' | 'training';
}

export type SessionListParams = {
  calendarId?: string;
  startDate: string;
  endDate: string;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.classes)) return record.classes;
  return [];
}

function idOf(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const record = asRecord(value);
  if (!record) return '';
  if (typeof record._id === 'string' || typeof record._id === 'number') return String(record._id);
  if (typeof record.id === 'string' || typeof record.id === 'number') return String(record.id);
  return '';
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

/** CRM stores start/end as ISO datetimes — show 12-hour clock for combineDateAndTime. */
function formatClock(value: unknown): string {
  const raw = str(value);
  if (!raw) return '12:00 AM';
  if (/[ap]m/i.test(raw)) return raw;
  const iso = raw.match(/T(\d{2}):(\d{2})/);
  if (iso) {
    const hour = Number(iso[1]);
    const minute = iso[2];
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${minute} ${suffix}`;
  }
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return raw;
}

/** Occurrence day — prefer classDate/startTime; `date` is often the series start. */
function occurrenceDate(row: UnknownRecord): string {
  for (const value of [row.classDate, row.startTime, row.date]) {
    const raw = str(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  }
  return '';
}

function mapStatus(raw: unknown, date: string): SessionStatus {
  const status = str(raw).toLowerCase();
  if (status.includes('cancel')) return 'cancelled';
  if (status.includes('complete') || status.includes('done') || status.includes('past')) {
    return 'completed';
  }
  if (date && date < toISODate(new Date())) return 'completed';
  return 'upcoming';
}

/** CRM calendar accents: navy = booked, green = open to book, grey = past, red = cancelled. */
function typeFromBooking(myBooking: SessionMyBooking | null, status: SessionStatus): SessionType {
  if (status === 'cancelled') return 'red';
  if (myBooking) {
    const st = (myBooking.status ?? '').toLowerCase();
    if (st.includes('cancel')) return 'red';
    return 'blue';
  }
  if (status === 'completed') return 'amber';
  return 'green';
}

function seatsLeftFrom(row: UnknownRecord): number {
  const limit = Number(row.bookingLimit ?? row.capacity ?? row.maxSeats ?? 0);
  const booked = Number(
    row.activeBookingsCount ??
      (Array.isArray(row.bookedSeats) ? row.bookedSeats.length : undefined) ??
      0,
  );
  if (Number.isFinite(limit) && limit > 0) {
    return Math.max(0, limit - (Number.isFinite(booked) ? booked : 0));
  }
  if (Array.isArray(row.availableSeats)) return row.availableSeats.length;
  const left = Number(row.seatsLeft ?? row.remainingSeats);
  return Number.isFinite(left) ? left : 0;
}

/**
 * Slim calendar omits `availableSeats` — derive from bookingLimit − bookedSeats.
 * Availability endpoint returns the authoritative list for the seat picker.
 */
function availableSeatsFrom(row: UnknownRecord): number[] | undefined {
  if (Array.isArray(row.availableSeats)) {
    const seats = row.availableSeats
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n > 0);
    return seats.length > 0 ? seats : [];
  }
  const limit = Number(row.bookingLimit ?? 0);
  if (!Number.isFinite(limit) || limit <= 0) return undefined;
  const booked = new Set(
    (Array.isArray(row.bookedSeats) ? row.bookedSeats : [])
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n)),
  );
  return Array.from({ length: limit }, (_, i) => i + 1).filter((n) => !booked.has(n));
}

function displayPersonName(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) {
    // Mongo ObjectId — resolve via users-lite later.
    if (/^[a-f0-9]{24}$/i.test(raw.trim())) return '';
    return raw.trim();
  }
  const row = asRecord(raw);
  if (!row) return '';
  const first = str(row.name, row.firstName, row.fname);
  const last = str(row.lname, row.lastName);
  return [first, last].filter(Boolean).join(' ').trim();
}

function buildInstructorNames(usersLite: unknown): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of asArray(usersLite)) {
    const row = asRecord(item);
    if (!row) continue;
    const id = idOf(row._id ?? row.id);
    const name = displayPersonName(row);
    if (id && name) map.set(id, name);
  }
  return map;
}

function mapMyBookingValue(raw: unknown): SessionMyBooking | null {
  if (raw == null) return null;
  const row = asRecord(raw);
  if (!row) return null;
  return {
    seat: Number(row.seat) || undefined,
    status: str(row.status) || undefined,
    attendance: str(row.attendance) || undefined,
  };
}

/** Slim calendar uses `myBooking`; full calendar uses `myBookings[]`. */
function mapMyBooking(row: UnknownRecord): SessionMyBooking | null {
  const singular = mapMyBookingValue(row.myBooking);
  if (singular) return singular;
  const list = asArray(row.myBookings);
  for (const item of list) {
    const mapped = mapMyBookingValue(item);
    if (!mapped) continue;
    const st = (mapped.status ?? '').toLowerCase();
    if (!st.includes('cancel')) return mapped;
  }
  return list.length > 0 ? mapMyBookingValue(list[0]) : null;
}

/** Badge for session cards — booked / open / past / cancelled. */
export function sessionStatusBadge(session: Session): { label: string; tone: BadgeTone } {
  if (session.status === 'cancelled') return { label: 'Cancelled', tone: 'danger' };
  const mb = session.myBooking;
  if (mb) {
    const st = (mb.status ?? '').toLowerCase();
    if (st.includes('cancel')) return { label: 'Cancelled', tone: 'danger' };
    return { label: 'Booked', tone: 'primary' };
  }
  if (session.status === 'completed') return { label: 'Past', tone: 'neutral' };
  return { label: 'Open', tone: 'success' };
}

export const sessionsApi = {
  async list(params: SessionListParams): Promise<Session[]> {
    const { startDate, endDate, calendarId } = params;
    const studentId = requireUserId();

    let classTypeAllow: Set<string> | null = null;
    let categoryAllow: Set<string> | null = null;
    try {
      const { userId, companyId } = requireStudentContext();
      const allocated = await getAllocatedCourses(userId, companyId, { slim: true });
      const scope = collectAllocatedCalendarScope(asArray(asRecord(allocated)?.data ?? allocated));
      if (scope.classTypeIds.size > 0) classTypeAllow = scope.classTypeIds;
      if (scope.categoryIds.size > 0) categoryAllow = scope.categoryIds;
    } catch {
      // Non-students or missing company: show unfiltered calendar range.
    }

    const [settings, calendarRaw, practicalRaw, usersLite] = await Promise.all([
      getCourseSettings(),
      getClassCalendar({
        startDate,
        endDate,
        viewAsStudentId: studentId,
        slim: true,
      }),
      getPracticalTrainingCalendar({
        startDate,
        endDate,
      }).catch(() => ({ data: [] as unknown[] })),
      getCalendarUsersLite().catch(() => [] as unknown[]),
    ]);

    const instructorNames = buildInstructorNames(usersLite);

    const classTitles = new Map((settings.classes ?? []).map((c) => [String(c._id), c.title]));
    const categoryTitles = new Map(
      (settings.categories ?? []).map((c) => [String(c._id), c.title]),
    );
    const locationTitles = new Map(
      (settings.locations ?? []).map((l) => [String(l._id), l.title]),
    );
    const classToCategory = new Map<string, string>();
    for (const item of settings.classes ?? []) {
      if (item.classCate) classToCategory.set(String(item._id), String(item.classCate));
    }

    const sessions: Session[] = [];

    for (const item of asList(calendarRaw)) {
      const row = asRecord(item);
      if (!row) continue;
      const id = idOf(row._id ?? row.id);
      if (!id) continue;

      const classTypeId = idOf(row.classType) || str(row.classType);
      const cateId =
        idOf(row.cateId) || str(row.cateId) || classToCategory.get(classTypeId) || '';
      const myBooking = mapMyBooking(row);

      // Always keep the student's own bookings; otherwise honour allocate scope.
      if (!myBooking) {
        if (classTypeAllow && classTypeId && !classTypeAllow.has(classTypeId)) {
          if (!categoryAllow?.has(cateId)) continue;
        } else if (!classTypeAllow && categoryAllow && cateId && !categoryAllow.has(cateId)) {
          continue;
        }
      }

      if (calendarId && calendarId !== 'all' && cateId !== calendarId) continue;

      const date = occurrenceDate(row);
      if (!date) continue;

      const title =
        str(row.className, row.title, row.eventType) ||
        classTitles.get(classTypeId) ||
        categoryTitles.get(cateId) ||
        'Class session';

      const locationId = idOf(row.location) || str(row.location);
      const instructorId = idOf(row.instructor) || str(row.instructor);
      const link = str(row.link, row.classLink, row.joinUrl, row.meetingLink);
      const location =
        locationTitles.get(locationId) ||
        str(row.room, row.classRoom, row.locationName) ||
        (link ? 'Online' : undefined) ||
        locationId ||
        undefined;

      const status = mapStatus(row.status, date);
      const instructor =
        displayPersonName(row.instructor) ||
        instructorNames.get(instructorId) ||
        'Instructor';

      sessions.push({
        id,
        calendarId: cateId || 'uncategorized',
        title,
        date,
        startTime: formatClock(row.startTime ?? row.start),
        endTime: formatClock(row.endTime ?? row.end),
        code: str(row.code, row.bookingCode, classTitles.get(classTypeId)) || id.slice(-6).toUpperCase(),
        type: typeFromBooking(myBooking, status),
        status,
        instructor,
        mode: link ? 'Online' : 'In-Person',
        description: str(row.description, row.notes) || title,
        attachments: [],
        joinUrl: link || undefined,
        location: link ? 'Online' : location,
        seatsLeft: seatsLeftFrom(row),
        availableSeats: availableSeatsFrom(row),
        myBooking,
        bookingLimit: Number(row.bookingLimit) || undefined,
        activeBookingsCount: Number(row.activeBookingsCount) || undefined,
        classTypeId: classTypeId || undefined,
        kind: 'class',
      });
    }

    const practicalList = asArray(asRecord(practicalRaw)?.data ?? practicalRaw);
    for (const item of practicalList) {
      const row = asRecord(item);
      if (!row) continue;
      const bookingId = idOf(row.bookingId) || idOf(row._id ?? row.id);
      const dayId = idOf(row.dayId);
      const id =
        bookingId && dayId
          ? `training:${dayId}:${bookingId}`
          : `training:${str(row.date)}:${idOf(row.shift) || str(row.shift)}`;
      const date = str(row.date).slice(0, 10);
      if (!date) continue;
      if (calendarId && calendarId !== 'all') continue;

      const shiftTime = str(row.shiftTime);
      const [shiftStart, shiftEnd] = shiftTime.includes('-')
        ? shiftTime.split('-').map((part) => part.trim())
        : ['', ''];
      const title =
        str(row.shift, row.title, row.locationName, 'Practical training') || 'Practical training';
      const myBooking: SessionMyBooking = {
        seat: Number(row.seat) || undefined,
        status: 'Active',
      };
      const status = mapStatus('active', date);
      sessions.push({
        id,
        calendarId: 'training',
        title,
        date,
        startTime: formatClock(shiftStart || row.startTime),
        endTime: formatClock(shiftEnd || row.endTime),
        code: str(row.locationName) || id.slice(-6).toUpperCase(),
        type: typeFromBooking(myBooking, status),
        status,
        instructor: 'Trainer',
        mode: 'In-Person',
        description: `${title}${row.locationName ? ` · ${str(row.locationName)}` : ''}`,
        attachments: [],
        location: str(row.locationName) || 'Training centre',
        seatsLeft: 0,
        myBooking,
        kind: 'training',
      });
    }

    // Booked first within a day (matches CRM month chips), then by start time.
    return sessions.sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate) return byDate;
      const aBooked = a.myBooking ? 0 : 1;
      const bBooked = b.myBooking ? 0 : 1;
      if (aBooked !== bBooked) return aBooked - bBooked;
      return a.startTime.localeCompare(b.startTime);
    });
  },

  async getById(id: string): Promise<Session> {
    const now = new Date();
    const startDate = toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const endDate = toISODate(new Date(now.getFullYear(), now.getMonth() + 2, 0));
    const list = await this.list({ startDate, endDate });
    const found = list.find((session) => session.id === id);
    if (!found) throw new Error('Session not found');
    return found;
  },
};
