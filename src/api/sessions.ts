import { getClassCalendar, getClassCalendarById, getCourseSettings } from '@/api/crm';

export type SessionType = 'green' | 'red' | 'amber' | 'blue';
export type SessionStatus = 'upcoming' | 'completed' | 'cancelled';

export interface SessionAttachment {
  id: string;
  name: string;
  sizeLabel: string;
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
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const record = asRecord(value);
  if (!record) return null;
  if (record._id != null) return String(record._id);
  if (record.$oid != null) return String(record.$oid);
  return null;
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function toISODate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return '';
}

/** CRM stores start/end as ISO datetimes — show HH:MM. */
function formatClock(value: unknown): string {
  const raw = str(value);
  if (!raw) return '';
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

type TitleMaps = {
  classes: Map<string, string>;
  categories: Map<string, string>;
  locations: Map<string, string>;
};

async function loadTitleMaps(): Promise<TitleMaps> {
  try {
    const settings = await getCourseSettings();
    return {
      classes: new Map((settings.classes ?? []).map((item) => [String(item._id), item.title])),
      categories: new Map((settings.categories ?? []).map((item) => [String(item._id), item.title])),
      locations: new Map((settings.locations ?? []).map((item) => [String(item._id), item.title])),
    };
  } catch {
    return { classes: new Map(), categories: new Map(), locations: new Map() };
  }
}

function mapCrmClassToSession(raw: unknown, maps: TitleMaps): Session | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = idOf(row._id ?? row.id);
  if (!id) return null;

  const date = toISODate(row.classDate ?? row.date ?? row.start);
  const classTypeId = idOf(row.classType) ?? str(row.classType);
  const cateId = idOf(row.cateId) ?? str(row.cateId);
  const locationId = idOf(row.location) ?? str(row.location);
  const title =
    str(row.className, row.title, row.eventType) ||
    maps.classes.get(classTypeId) ||
    maps.categories.get(cateId) ||
    'Class';
  const link = str(row.link, row.classLink, row.joinUrl, row.meetingLink);
  const location =
    maps.locations.get(locationId) ||
    str(row.room, row.classRoom, row.locationName) ||
    undefined;

  const statusRaw = str(row.status, row.classStatus).toLowerCase();
  let status: SessionStatus = 'upcoming';
  if (statusRaw.includes('cancel')) status = 'cancelled';
  else if (date && date < new Date().toISOString().slice(0, 10)) status = 'completed';

  return {
    id,
    calendarId: classTypeId || cateId || 'all',
    title,
    date,
    startTime: formatClock(row.startTime ?? row.classStartTime),
    endTime: formatClock(row.endTime ?? row.classEndTime),
    code: str(row.code, row.bookingCode, id.slice(-6).toUpperCase()),
    type: typeFromSeed(id),
    status,
    instructor: str(asRecord(row.instructor)?.name, row.instructor) || 'Instructor',
    mode: link ? 'Online' : 'In-Person',
    description: str(row.description, row.notes) || title,
    attachments: [],
    joinUrl: link || undefined,
    location,
  };
}

export const sessionsApi = {
  async list(calendarId?: string): Promise<Session[]> {
    const [raw, maps] = await Promise.all([getClassCalendar(), loadTitleMaps()]);
    const sessions = asArray(raw)
      .map((item) => mapCrmClassToSession(item, maps))
      .filter((item): item is Session => Boolean(item));

    if (!calendarId || calendarId === 'all') return sessions;
    return sessions.filter((session) => session.calendarId === calendarId);
  },

  async getById(id: string): Promise<Session | undefined> {
    const maps = await loadTitleMaps();
    try {
      const mapped = mapCrmClassToSession(await getClassCalendarById(id), maps);
      if (mapped) return mapped;
    } catch {
      // fall through
    }
    const all = await sessionsApi.list();
    return all.find((session) => session.id === id);
  },
};
