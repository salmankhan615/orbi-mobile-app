import {
  acknowledgeAnnouncement,
  createAnnouncement,
  getAnnouncementById,
  getMyAnnouncements,
  updateAnnouncement,
} from '@/api/crm';

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

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function mapAudience(raw: UnknownRecord): AnnouncementAudience {
  const value = String(raw.audience ?? raw.targetAudience ?? raw.for ?? '').toLowerCase();
  if (value.includes('staff')) return 'staff';
  if (value.includes('student')) return 'students';
  return 'all';
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
  };
}

function filterAudience(list: Announcement[], audience?: AnnouncementAudience) {
  if (!audience || audience === 'all') return list;
  return list.filter((item) => item.audience === 'all' || item.audience === audience);
}

export const announcementsApi = {
  async list(audience?: AnnouncementAudience): Promise<Announcement[]> {
    const raw = await getMyAnnouncements();
    const mapped = asList(raw)
      .map(mapCrmAnnouncement)
      .filter((item): item is Announcement => Boolean(item));
    return filterAudience(mapped, audience).sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt),
    );
  },

  async getById(id: string): Promise<Announcement | undefined> {
    try {
      const raw = await getAnnouncementById(id);
      const mapped = mapCrmAnnouncement(asRecord(raw)?.data ?? raw);
      if (mapped) return mapped;
    } catch {
      // fall through to list lookup
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
      pinned: payload.pinned,
      audience: payload.audience,
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
    const raw = await updateAnnouncement(id, {
      title: patch.title,
      announcement: patch.body,
      pinned: patch.pinned,
      audience: patch.audience,
    });
    return mapCrmAnnouncement(asRecord(raw)?.data ?? raw) ?? announcementsApi.getById(id);
  },
};
