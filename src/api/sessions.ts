import type { BadgeTone } from '@/components/ui/Badge';
import {
  getAllocatedCourses,
  getClassCalendar,
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

const TYPES: SessionType[] = ['green', 'red', 'amber', 'blue'];

function typeFromSeed(seed: string): SessionType {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TYPES[hash % TYPES.length];
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
  const left = Number(row.seatsLeft ?? row.availableSeats ?? row.remainingSeats);
  return Number.isFinite(left) ? left : 0;
}

function mapMyBooking(raw: unknown): SessionMyBooking | null {
  if (raw == null) return null;
  const row = asRecord(raw);
  if (!row) return null;
  return {
    seat: Number(row.seat) || undefined,
    status: str(row.status) || undefined,
    attendance: str(row.attendance) || undefined,
  };
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

    const [settings, calendarRaw, practicalRaw] = await Promise.all([
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
        viewAsStudentId: studentId,
        studentId,
      }).catch(() => ({ data: [] as unknown[] })),
    ]);

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

      if (classTypeAllow && classTypeId && !classTypeAllow.has(classTypeId)) {
        if (!categoryAllow?.has(cateId)) continue;
      } else if (!classTypeAllow && categoryAllow && cateId && !categoryAllow.has(cateId)) {
        continue;
      }

      if (calendarId && calendarId !== 'all' && cateId !== calendarId) continue;

      const date = str(row.date, row.classDate).slice(0, 10);
      if (!date) continue;

      const title =
        str(row.title, row.className, row.eventType) ||
        classTitles.get(classTypeId) ||
        categoryTitles.get(cateId) ||
        'Class session';

      const locationId = idOf(row.location) || str(row.location);
      const instructorId = idOf(row.instructor) || str(row.instructor);
      const link = str(row.link, row.classLink, row.joinUrl, row.meetingLink);
      const location =
        locationTitles.get(locationId) ||
        str(row.room, row.classRoom, row.locationName) ||
        locationId ||
        undefined;

      sessions.push({
        id,
        calendarId: cateId || 'uncategorized',
        title,
        date,
        startTime: formatClock(row.startTime ?? row.start),
        endTime: formatClock(row.endTime ?? row.end),
        code: str(row.code, row.bookingCode) || id.slice(-6).toUpperCase(),
        type: typeFromSeed(id),
        status: mapStatus(row.status, date),
        instructor: instructorId || 'Instructor',
        mode: link ? 'Online' : 'In-Person',
        description: str(row.description, row.notes) || title,
        attachments: [],
        joinUrl: link || undefined,
        location,
        seatsLeft: seatsLeftFrom(row),
        myBooking: mapMyBooking(row.myBooking),
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
      const id = idOf(row._id ?? row.id) || `training:${str(row.date)}:${idOf(row.shift)}`;
      const date = str(row.date, row.dayDate, row.classDate).slice(0, 10);
      if (!date) continue;
      if (calendarId && calendarId !== 'all') continue;

      const title = str(row.title, row.locationName, row.name, 'Practical training');
      sessions.push({
        id,
        calendarId: 'training',
        title,
        date,
        startTime: formatClock(row.startTime ?? row.start),
        endTime: formatClock(row.endTime ?? row.end),
        code: str(row.code) || id.slice(-6).toUpperCase(),
        type: typeFromSeed(id),
        status: mapStatus(row.status, date),
        instructor: str(row.instructor, row.trainer, 'Trainer'),
        mode: 'In-Person',
        description: title,
        attachments: [],
        location: str(row.locationName, row.location) || 'Training centre',
        seatsLeft: Number(row.availableSeats ?? row.seatsLeft ?? 0) || 0,
        myBooking: mapMyBooking(row.myBooking ?? row.booking) ?? {
          seat: Number(row.seat) || undefined,
          status: str(row.bookingStatus, row.status) || 'Active',
        },
        kind: 'training',
      });
    }

    return sessions.sort(
      (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    );
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
