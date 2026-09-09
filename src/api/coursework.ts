import { getStudentCoursework } from '@/api/crm';
import { requireUserId } from '@/api/sessionUser';
import { unwrapList } from '@/api/unwrap';
import type { CourseworkFeedback, CourseworkFile, CourseworkItem } from '@/api/staff';

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

function num(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Match CRM table: `20-07-2026`. */
export function formatCourseworkDate(value: unknown): string {
  const raw = str(value);
  if (!raw) return '—';
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
  const dd = String(parsed.getUTCDate()).padStart(2, '0');
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function mapKind(raw: unknown): CourseworkItem['kind'] {
  const value = str(raw).toLowerCase();
  if (value === 'assignment') return 'assignment';
  if (value === 'resource') return 'resource';
  return 'other';
}

function mapFile(raw: unknown): CourseworkFile | null {
  const row = asRecord(raw);
  if (!row) return null;
  const url = str(row.url, row.key, row.path);
  if (!url) return null;
  return {
    url,
    filename: str(row.filename, row.name, row.fileName, url),
    type: str(row.type, 'FILE').toUpperCase(),
  };
}

/**
 * CRM coursework attachments are stored under the S3 `coursework/` prefix:
 * `https://orbierp-s3-bucket.s3.eu-west-2.amazonaws.com/coursework/<key>`
 * (same as the web `rae()` helper — not `/uploads` or `/videos`).
 */
export function crmMediaUrl(file: Pick<CourseworkFile, 'url' | 'type'>): string {
  const key = str(file.url);
  if (!key) return '';
  if (/^https?:\/\//i.test(key)) return key;
  return `https://orbierp-s3-bucket.s3.eu-west-2.amazonaws.com/coursework/${encodeURIComponent(key)}`;
}

function mapStatus(row: UnknownRecord): CourseworkItem['status'] {
  const submission = asRecord(row.mySubmission);
  if (submission) {
    const status = str(submission.status).toLowerCase();
    if (status.includes('grade') || submission.score != null || submission.gradedAt) {
      return 'graded';
    }
    if (status.includes('submit') || submission.submittedAt) return 'submitted';
  }
  return 'open';
}

function mapComments(raw: unknown): CourseworkFeedback[] {
  const comments: CourseworkFeedback[] = [];
  for (const item of asArray(raw)) {
    const row = asRecord(item);
    if (!row) continue;
    const text = str(row.text, row.comment, row.message);
    if (!text) continue;
    comments.push({
      id: idOf(row._id) ?? text.slice(0, 12),
      text,
      authorRole: str(row.authorRole) || undefined,
      createdAt: str(row.createdAt) || undefined,
    });
  }
  return comments;
}

/** Map CRM `GET /api/course/crm/student/coursework` into app rows. */
export function mapStudentCoursework(raw: unknown): CourseworkItem[] {
  const rows: CourseworkItem[] = [];
  for (const item of unwrapList(raw)) {
    const row = asRecord(item);
    if (!row || row.deletedAt) continue;
    const id = idOf(row._id ?? row.id);
    if (!id) continue;

    const kind = mapKind(row.kind);
    const groupName = str(row.groupName, 'Group');
    const submission = asRecord(row.mySubmission);
    const attachments = asArray(row.attachments)
      .map(mapFile)
      .filter((file): file is CourseworkFile => Boolean(file));

    const submissionFiles = submission
      ? asArray(submission.files)
          .map(mapFile)
          .filter((file): file is CourseworkFile => Boolean(file))
      : [];

    rows.push({
      id,
      title: str(row.title, 'Untitled'),
      courseTitle: groupName,
      groupName,
      kind,
      dueDate: formatCourseworkDate(row.dueDate),
      dueDateIso: str(row.dueDate) || undefined,
      status: mapStatus(row),
      score: num(submission?.score),
      maxScore: num(row.maxScore),
      instructions: str(row.instructions) || undefined,
      attachments,
      submission: submission
        ? {
            id: idOf(submission._id) ?? undefined,
            status: str(submission.status) || undefined,
            score: num(submission.score),
            submittedAt: str(submission.submittedAt) || undefined,
            gradedAt: str(submission.gradedAt) || undefined,
            gradedByName: str(submission.gradedByName) || undefined,
            isLate: submission.isLate === true,
            files: submissionFiles,
            comments: mapComments(submission.comments),
          }
        : undefined,
    });
  }
  return rows;
}

export async function fetchStudentCoursework(): Promise<CourseworkItem[]> {
  const studentId = requireUserId();
  const raw = await getStudentCoursework(studentId);
  return mapStudentCoursework(raw);
}

export function isCourseworkOverdue(item: CourseworkItem): boolean {
  if (!item.dueDateIso) return false;
  const end = new Date(item.dueDateIso);
  if (Number.isNaN(end.getTime())) return false;
  end.setHours(23, 59, 59, 999);
  return Date.now() > end.getTime();
}

/** CRM `kind` → Coursework UI tab. */
export type CourseworkTab = 'assignment' | 'resource';

export function courseworkTabForKind(kind: CourseworkItem['kind'] | string | undefined): CourseworkTab {
  return String(kind ?? '').toLowerCase() === 'resource' ? 'resource' : 'assignment';
}
