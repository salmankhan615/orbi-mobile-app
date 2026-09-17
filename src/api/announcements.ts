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
export type AnnouncementType = 'General' | 'System' | 'Course' | 'Urgent';
export type AnnouncementPriority = 'Low' | 'Medium' | 'High';
export type AnnouncementStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived';

export interface AnnouncementAttachment {
  name: string;
  url: string;
}

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
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  /** Staff manage list — Draft / Published / Scheduled / Archived */
  status?: AnnouncementStatus | string;
  publishAt?: string;
  expiresAt?: string;
  publishLabel?: string;
  expiryLabel?: string;
  sendEmail?: boolean;
  courseIds?: string[];
  groupIds?: string[];
  attachments?: AnnouncementAttachment[];
}

export type AnnouncementWritePayload = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  pinned: boolean;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  sendEmail: boolean;
  publishAt?: string;
  expiresAt?: string;
  courseIds?: string[];
  groupIds?: string[];
  attachments?: AnnouncementAttachment[];
  author?: string;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
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
  if (record.id != null) return String(record.id);
  return null;
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
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

function mapType(raw: UnknownRecord): AnnouncementType {
  const text = str(raw.type, raw.announcementType).toLowerCase();
  if (text.includes('urgent')) return 'Urgent';
  if (text.includes('system')) return 'System';
  if (text.includes('course')) return 'Course';
  return 'General';
}

function mapPriority(raw: UnknownRecord): AnnouncementPriority {
  const text = str(raw.priority).toLowerCase();
  if (text.includes('high') || text.includes('urgent')) return 'High';
  if (text.includes('low')) return 'Low';
  return 'Medium';
}

function mapStatus(raw: UnknownRecord): string {
  const text = str(raw.status);
  if (!text) return 'Published';
  const lower = text.toLowerCase();
  if (lower.includes('draft')) return 'Draft';
  if (lower.includes('archiv')) return 'Archived';
  if (lower.includes('schedul')) return 'Scheduled';
  if (lower.includes('publish')) return 'Published';
  return text;
}

function formatDateTime(value: unknown): string {
  const raw = str(value);
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss}`;
}

function idList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => idOf(item) || str(item))
    .filter(Boolean);
}

function mapAttachments(raw: unknown): AnnouncementAttachment[] {
  if (!Array.isArray(raw)) return [];
  const out: AnnouncementAttachment[] = [];
  for (const item of raw) {
    const row = asRecord(item);
    if (!row) {
      if (typeof item === 'string' && item.trim()) {
        out.push({ name: item.trim(), url: item.trim() });
      }
      continue;
    }
    const url = str(row.url, row.href, row.link);
    const name = str(row.name, row.filename, row.title, url);
    if (url) out.push({ name: name || url, url });
  }
  return out;
}

export function mapCrmAnnouncement(raw: unknown): Announcement | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = idOf(row._id ?? row.id);
  if (!id) return null;
  const createdBy = asRecord(row.createdBy);
  const html = String(row.announcement ?? row.body ?? row.message ?? row.content ?? '');
  const publishAt = str(row.publishAt ?? row.publishedAt ?? row.createdAt);
  const expiresAt = str(row.expiresAt ?? row.expiryAt ?? row.archiveAt);
  const authorFirst = str(createdBy?.name, createdBy?.firstName);
  const authorLast = str(createdBy?.lname, createdBy?.lastName);
  const author =
    [authorFirst, authorLast].filter(Boolean).join(' ').trim() ||
    str(row.author, 'System Admin');

  return {
    id,
    title: String(row.title ?? 'Announcement'),
    body: stripHtml(html) || String(row.title ?? ''),
    createdAt: publishAt || new Date().toISOString(),
    author,
    audience: mapAudience(row),
    pinned: Boolean(row.pinned ?? row.isPinned ?? row.type === 'Urgent'),
    isAcknowledged: Boolean(row.isAcknowledged),
    type: mapType(row),
    priority: mapPriority(row),
    status: mapStatus(row),
    publishAt: publishAt || undefined,
    expiresAt: expiresAt || undefined,
    publishLabel: publishAt ? formatDateTime(publishAt) : undefined,
    expiryLabel: expiresAt ? formatDateTime(expiresAt) : 'Never',
    sendEmail: Boolean(row.sendEmail),
    courseIds: idList(row.courseIds ?? row.courses ?? row.targetCourses),
    groupIds: idList(row.groupIds ?? row.batches ?? row.targetGroups),
    attachments: mapAttachments(row.attachments),
  };
}

function filterAudience(list: Announcement[], audience?: AnnouncementAudience) {
  if (!audience || audience === 'all') return list;
  return list.filter((item) => item.audience === 'all' || item.audience === audience);
}

function toCrmPayload(payload: AnnouncementWritePayload): Record<string, unknown> {
  const attachments = (payload.attachments ?? [])
    .filter((item) => item.url.trim())
    .map((item) => ({
      name: item.name.trim() || item.url.trim(),
      url: item.url.trim(),
    }));
  return {
    title: payload.title.trim(),
    announcement: payload.body.trim(),
    type: payload.type,
    priority: payload.priority,
    pinned: payload.pinned,
    status: payload.status,
    sendEmail: payload.sendEmail,
    attachments,
    audience: audiencePayload(payload.audience),
    ...(payload.publishAt?.trim() ? { publishAt: payload.publishAt.trim() } : {}),
    ...(payload.expiresAt?.trim() ? { expiresAt: payload.expiresAt.trim() } : {}),
    ...(payload.courseIds?.length ? { courseIds: payload.courseIds } : {}),
    ...(payload.groupIds?.length ? { groupIds: payload.groupIds } : {}),
  };
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
    const raw = await getAnnouncements({ limit: 100 });
    return asList(raw)
      .map(mapCrmAnnouncement)
      .filter((item): item is Announcement => Boolean(item))
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

  async create(payload: AnnouncementWritePayload): Promise<Announcement> {
    const raw = await createAnnouncement(toCrmPayload(payload));
    return (
      mapCrmAnnouncement(asRecord(raw)?.data ?? raw) ?? {
        id: `a${Date.now()}`,
        title: payload.title,
        body: payload.body,
        createdAt: new Date().toISOString(),
        author: payload.author || 'Staff',
        audience: payload.audience,
        pinned: payload.pinned,
        type: payload.type,
        priority: payload.priority,
        status: payload.status,
      }
    );
  },

  async update(id: string, patch: Partial<AnnouncementWritePayload>): Promise<Announcement | undefined> {
    const body: Record<string, unknown> = {};
    if (patch.title != null) body.title = patch.title.trim();
    if (patch.body != null) body.announcement = patch.body.trim();
    if (patch.pinned != null) body.pinned = patch.pinned;
    if (patch.type != null) body.type = patch.type;
    if (patch.priority != null) body.priority = patch.priority;
    if (patch.status != null) body.status = patch.status;
    if (patch.sendEmail != null) body.sendEmail = patch.sendEmail;
    if (patch.audience != null) body.audience = audiencePayload(patch.audience);
    if (patch.publishAt !== undefined) {
      if (patch.publishAt?.trim()) body.publishAt = patch.publishAt.trim();
      else body.publishAt = null;
    }
    if (patch.expiresAt !== undefined) {
      if (patch.expiresAt?.trim()) body.expiresAt = patch.expiresAt.trim();
      else body.expiresAt = null;
    }
    if (patch.courseIds != null) body.courseIds = patch.courseIds;
    if (patch.groupIds != null) body.groupIds = patch.groupIds;
    if (patch.attachments != null) {
      body.attachments = patch.attachments
        .filter((item) => item.url.trim())
        .map((item) => ({
          name: item.name.trim() || item.url.trim(),
          url: item.url.trim(),
        }));
    }
    const raw = await updateAnnouncement(id, body);
    return mapCrmAnnouncement(asRecord(raw)?.data ?? raw) ?? announcementsApi.getById(id);
  },

  async remove(id: string): Promise<void> {
    await deleteAnnouncement(id);
  },
};
