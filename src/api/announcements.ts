import {
  acknowledgeAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  getAnnouncements,
  getMyAnnouncements,
  updateAnnouncement,
} from '@/api/crm';
import { stripHtml } from '@/utils/stripHtml';

export type AnnouncementAudience = 'all' | 'students' | 'staff';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: string;
  audience: AnnouncementAudience;
  pinned: boolean;
  /** CRM flag — preferred over local ack store when present. */
  isAcknowledged?: boolean;
  /** Staff manage list — Draft / Published / Scheduled / … */
  status?: string;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const record = asRecord(raw);
  if (record && Array.isArray(record.data)) return record.data;
  return [];
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const record = asRecord(value);
  if (!record) return null;
  if (record._id != null) return String(record._id);
  if (record.$oid != null) return String(record.$oid);
  return null;
}

function mapAudience(raw: UnknownRecord): AnnouncementAudience {
  const value = raw.audience;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const audience = value as UnknownRecord;
    if (audience.staff && !audience.students && !audience.all) return 'staff';
    if (audience.students && !audience.staff && !audience.all) return 'students';
    return 'all';
  }
  const text = String(value ?? raw.targetAudience ?? raw.for ?? '').toLowerCase();
  if (text.includes('staff')) return 'staff';
  if (text.includes('student')) return 'students';
  return 'all';
}

function audiencePayload(audience: AnnouncementAudience): Record<string, boolean> {
  if (audience === 'staff') return { staff: true };
  if (audience === 'students') return { students: true };
  return { all: true };
}

export function mapCrmAnnouncement(raw: unknown): Announcement | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = idOf(row._id ?? row.id);
  if (!id) return null;
  const createdBy = asRecord(row.createdBy);
  const html = String(row.announcement ?? row.body ?? row.message ?? row.content ?? '');
  return {
    id,
    title: String(row.title ?? 'Announcement'),
    body: stripHtml(html) || String(row.title ?? ''),
    createdAt: String(row.publishAt ?? row.createdAt ?? new Date().toISOString()),
    author: String(createdBy?.name ?? row.author ?? 'System Admin'),
    audience: mapAudience(row),
    pinned: Boolean(row.pinned ?? row.isPinned ?? row.type === 'Urgent'),
    isAcknowledged: Boolean(row.isAcknowledged),
    status: String(row.status ?? '').trim() || undefined,
  };
}

function filterAudience(list: Announcement[], audience?: AnnouncementAudience) {
  if (!audience || audience === 'all') return list;
  return list.filter((item) => item.audience === 'all' || item.audience === audience);
}

export const announcementsApi = {
  /** Student / personal feed (`GET /api/announcements/my`). */
  async list(audience?: AnnouncementAudience): Promise<Announcement[]> {
    const raw = await getMyAnnouncements();
    const mapped = asList(raw)
      .map(mapCrmAnnouncement)
      .filter((item): item is Announcement => Boolean(item));
    return filterAudience(mapped, audience).sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt),
    );
  },

  /** Staff management list (`GET /api/announcements`). */
  async listManage(): Promise<Announcement[]> {
    const raw = await getAnnouncements({ limit: 25 });
    return asList(raw)
      .map(mapCrmAnnouncement)
      .filter((item): item is Announcement => Boolean(item))
      .slice(0, 25)
      .sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt),
      );
  },

  async getById(id: string): Promise<Announcement | undefined> {
    try {
      const raw = await getAnnouncementById(id);
      const mapped = mapCrmAnnouncement(asRecord(raw)?.data ?? raw);
      if (mapped) return mapped;
    } catch {
      // fall through
    }
    try {
      const managed = await announcementsApi.listManage();
      const found = managed.find((item) => item.id === id);
      if (found) return found;
    } catch {
      // fall through
    }
    const all = await announcementsApi.list();
    return all.find((item) => item.id === id);
  },

  async acknowledge(id: string): Promise<void> {
    await acknowledgeAnnouncement(id);
  },

  async create(payload: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
    const raw = await createAnnouncement({
      title: payload.title,
      announcement: payload.body,
      type: payload.pinned ? 'Urgent' : 'General',
      priority: payload.pinned ? 'High' : 'Normal',
      pinned: payload.pinned,
      status: 'Published',
      sendEmail: false,
      attachments: [],
      audience: audiencePayload(payload.audience),
    });
    return (
      mapCrmAnnouncement(asRecord(raw)?.data ?? raw) ?? {
        ...payload,
        id: `a${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
    );
  },

  async update(id: string, patch: Partial<Announcement>): Promise<Announcement | undefined> {
    const body: Record<string, unknown> = {};
    if (patch.title != null) body.title = patch.title;
    if (patch.body != null) body.announcement = patch.body;
    if (patch.pinned != null) {
      body.pinned = patch.pinned;
      body.type = patch.pinned ? 'Urgent' : 'General';
      body.priority = patch.pinned ? 'High' : 'Normal';
    }
    if (patch.audience != null) body.audience = audiencePayload(patch.audience);
    const raw = await updateAnnouncement(id, body);
    return mapCrmAnnouncement(asRecord(raw)?.data ?? raw) ?? announcementsApi.getById(id);
  },

  async remove(id: string): Promise<void> {
    await deleteAnnouncement(id);
  },
};
