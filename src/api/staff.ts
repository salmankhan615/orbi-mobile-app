import {
  addCalendarClosure,
  deleteCalendarClosure,
  getAdminPracticalBookings,
  getAgreementSubmissions,
  getAllPaymentPlans,
  getCalendarClosures,
  getCalendarUsersLite,
  getCourseworkSubmissions,
  getGroupSessions,
  getGroupStudents,
  getStaffCoursework,
  getStaffGroups,
  getUsersByType,
} from '@/api/crm';
import { API_BASE_URL } from '@/api/config';
import { formatCourseworkDate } from '@/api/coursework';
import { requireStudentContext } from '@/api/sessionUser';
import { unwrapList } from '@/api/unwrap';
import { toISODate } from '@/utils/date';
import { stripHtml } from '@/utils/stripHtml';

export interface StaffGroup {
  id: string;
  name: string;
  courseTitle: string;
  studentCount: number;
  nextSession: string;
}

export interface GroupSession {
  id: string;
  groupId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

export interface GroupStudent {
  id: string;
  name: string;
  email: string;
  progress: number;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'staff';
  status: 'active' | 'invited';
}

export interface CourseworkFile {
  url: string;
  filename: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE' | string;
}

export interface CourseworkFeedback {
  id: string;
  text: string;
  authorRole?: string;
  createdAt?: string;
}

export interface CourseworkItem {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string;
  status: 'open' | 'submitted' | 'graded';
  /** CRM student coursework fields */
  kind?: 'assignment' | 'resource' | 'other';
  groupName?: string;
  score?: number;
  maxScore?: number;
  instructions?: string;
  /** Raw ISO due date for overdue checks */
  dueDateIso?: string;
  attachments?: CourseworkFile[];
  submission?: {
    id?: string;
    status?: string;
    score?: number;
    submittedAt?: string;
    gradedAt?: string;
    gradedByName?: string;
    isLate?: boolean;
    files?: CourseworkFile[];
    comments?: CourseworkFeedback[];
  };
}

export interface CourseworkSubmission {
  id: string;
  assignmentId: string;
  studentName: string;
  submittedAt: string;
  status: 'submitted' | 'late' | 'graded';
  grade?: string;
  isLate?: boolean;
  files?: CourseworkFile[];
  comments?: CourseworkFeedback[];
}

export interface InvoiceInstallment {
  id: string;
  label: string;
  amountLabel: string;
  dueDate: string;
  status: string;
}

export interface Invoice {
  id: string;
  studentName: string;
  studentEmail?: string;
  amountLabel: string;
  status: 'paid' | 'due' | 'overdue';
  issuedOn: string;
  planName?: string;
  invoiceNumber?: string;
  dueOn?: string;
  paidOn?: string;
  notes?: string;
  installments?: InvoiceInstallment[];
}

export interface AgreementArtifact {
  id: string;
  filename: string;
  type: string;
  url: string;
}

export interface Agreement {
  id: string;
  studentName: string;
  studentEmail?: string;
  title: string;
  status: 'pending' | 'signed' | 'expired';
  /** Raw CRM status (e.g. Sent, Completed). */
  statusLabel?: string;
  submittedOn: string;
  signedOn?: string;
  expiresOn?: string;
  senderName?: string;
  deliveryMethod?: string;
  agreementType?: string;
  recipientId?: string;
  artifacts?: AgreementArtifact[];
}

export interface BookingShift {
  id: string;
  dayId: string;
  bookingId: string;
  studentId?: string;
  studentName: string;
  studentEmail?: string;
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  seat?: number;
  status: 'active' | 'cancelled';
  statusLabel: string;
  attendance?: string;
  bookedAt?: string;
  bookedByName?: string;
  cancelledAt?: string;
  isOverridden?: boolean;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
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
  if (record.id != null) return String(record.id);
  return null;
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function personName(raw: unknown): string {
  const row = asRecord(raw);
  if (!row) return str(raw) || '—';
  const first = str(row.name, row.firstName);
  const last = str(row.lname, row.lastName);
  return `${first} ${last}`.trim() || str(row.email) || '—';
}

function toISODay(value: unknown): string {
  const raw = str(value);
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function formatClock(value: unknown): string {
  const raw = str(value);
  if (!raw) return '—';
  if (/[ap]m/i.test(raw)) return raw;
  const iso = raw.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return raw;
}

function mapDirectoryRole(raw: UnknownRecord): DirectoryUser['role'] {
  const type = str(raw.type, raw.role).toLowerCase();
  if (type.includes('student') || type.includes('trainee') || type.includes('learner')) {
    return 'student';
  }
  return 'staff';
}

function mapDirectoryStatus(raw: UnknownRecord): DirectoryUser['status'] {
  const status = str(raw.status).toLowerCase();
  if (status.includes('invite') || status.includes('pending')) return 'invited';
  return 'active';
}

function mapSubmissionFile(raw: unknown): CourseworkFile | null {
  const row = asRecord(raw);
  if (!row) return null;
  const url = str(row.url, row.key, row.path, row.filename);
  if (!url) return null;
  return {
    url,
    filename: str(row.filename, row.name, row.fileName, url),
    type: str(row.type, 'FILE').toUpperCase(),
  };
}

function mapSubmissionComments(raw: unknown): CourseworkFeedback[] {
  const comments: CourseworkFeedback[] = [];
  for (const item of asArray(raw)) {
    const row = asRecord(item);
    if (!row) continue;
    const text = stripHtml(str(row.text, row.comment, row.message));
    if (!text) continue;
    comments.push({
      id: idOf(row._id ?? row.id) ?? text.slice(0, 12),
      text,
      authorRole: str(row.authorRole, asRecord(row.author)?.role) || undefined,
      createdAt: str(row.createdAt) || undefined,
    });
  }
  return comments;
}

function mapStaffCourseworkItem(raw: unknown): CourseworkItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = idOf(row._id ?? row.id);
  if (!id) return null;
  const submissionCount = num(row.submissionCount);
  const gradedCount = num(row.gradedCount);
  let status: CourseworkItem['status'] = 'open';
  if (gradedCount > 0 && gradedCount >= submissionCount && submissionCount > 0) {
    status = 'graded';
  } else if (submissionCount > 0) {
    status = 'submitted';
  }
  const dueIso = toISODay(row.dueDate);
  return {
    id,
    title: str(row.title, 'Coursework'),
    courseTitle: str(row.groupName, row.courseTitle, row.courseName, 'Group'),
    dueDate: formatCourseworkDate(row.dueDate),
    dueDateIso: dueIso || undefined,
    status,
    kind: str(row.kind).toLowerCase() === 'resource' ? 'resource' : 'assignment',
    groupName: str(row.groupName) || undefined,
    maxScore: num(row.maxScore) || undefined,
    instructions: str(row.instructions) || undefined,
  };
}

function moneyLabel(amount: number, currencyRaw?: string): string {
  if (!amount) return '—';
  const currency = str(currencyRaw, '£');
  const symbol = currency.length === 1 ? currency : `${currency} `;
  return `${symbol}${amount.toFixed(2)}`;
}

function mapInvoiceAmount(raw: UnknownRecord): string {
  const total =
    num(raw.totalAmount) ||
    num(raw.amount) ||
    num(raw.total) ||
    asArray(raw.installments ?? raw.invoices).reduce<number>((sum, item) => {
      const row = asRecord(item);
      return sum + num(row?.amount ?? row?.total);
    }, 0);
  return moneyLabel(total, str(raw.currency));
}

function mapInvoiceStatus(raw: UnknownRecord): Invoice['status'] {
  const status = str(raw.status, raw.paymentStatus, raw.planStatus).toLowerCase();
  if (status.includes('paid') || status.includes('complete')) return 'paid';
  if (status.includes('overdue') || status.includes('late')) return 'overdue';
  const installments = asArray(raw.installments ?? raw.invoices);
  if (installments.length > 0) {
    const allPaid = installments.every((item) => {
      const row = asRecord(item);
      const s = str(row?.status, row?.paymentStatus).toLowerCase();
      return s.includes('paid') || s.includes('complete');
    });
    if (allPaid) return 'paid';
    const anyOverdue = installments.some((item) => {
      const row = asRecord(item);
      const s = str(row?.status, row?.paymentStatus).toLowerCase();
      return s.includes('overdue') || s.includes('late');
    });
    if (anyOverdue) return 'overdue';
  }
  return 'due';
}

function mapInstallments(raw: UnknownRecord): InvoiceInstallment[] {
  const currency = str(raw.currency, '£');
  const out: InvoiceInstallment[] = [];
  for (const [index, item] of asArray(raw.installments ?? raw.invoices).entries()) {
    const row = asRecord(item);
    if (!row) continue;
    const id = idOf(row._id ?? row.id) ?? `installment-${index}`;
    const amount = num(row.amount ?? row.total);
    out.push({
      id,
      label: str(row.label, row.name, row.title, `Installment ${index + 1}`),
      amountLabel: moneyLabel(amount, currency),
      dueDate: formatCourseworkDate(row.dueDate ?? row.date ?? row.paymentDate),
      status: str(row.status, row.paymentStatus, 'due') || 'due',
    });
  }
  return out;
}

function mapAgreementStatus(raw: string): Agreement['status'] {
  const status = raw.toLowerCase();
  if (status.includes('complete') || status === 'signed') return 'signed';
  if (
    status.includes('expir') ||
    status.includes('declin') ||
    status.includes('cancel') ||
    status.includes('fail') ||
    status.includes('archiv') ||
    status.includes('supersed')
  ) {
    return 'expired';
  }
  return 'pending';
}

function absoluteMediaUrl(raw: string): string {
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${API_BASE_URL}${raw}`;
  return raw;
}

function mapAgreementArtifacts(raw: unknown, recipientId?: string): AgreementArtifact[] {
  const out: AgreementArtifact[] = [];
  for (const [index, item] of asArray(raw).entries()) {
    const row = asRecord(item);
    if (!row) continue;
    const id = idOf(row._id ?? row.id ?? row.artifactId) ?? `artifact-${index}`;
    const filename = str(row.filename, row.name, row.label, row.title, 'Document');
    const type = str(row.type, row.mimeType, row.contentType, 'FILE').toUpperCase();
    let url = str(row.url, row.downloadUrl, row.fileUrl, row.key, row.path);
    if (!url && recipientId) {
      url = `${API_BASE_URL}/api/agreements/submissions/${encodeURIComponent(recipientId)}/artifacts/${encodeURIComponent(id)}`;
    }
    url = absoluteMediaUrl(url);
    if (!url) continue;
    out.push({ id, filename, type, url });
  }
  return out;
}

function mapClosureDates(raw: unknown): { id: string; date: string }[] {
  const out: { id: string; date: string }[] = [];
  for (const item of unwrapList(raw)) {
    const row = asRecord(item);
    if (!row) continue;
    const id = idOf(row._id ?? row.id);
    if (!id) continue;
    if (row.is_permanent) continue;
    const date = toISODay(row.date);
    if (date) out.push({ id, date });
  }
  return out;
}

export const staffApi = {
  async groups(): Promise<StaffGroup[]> {
    const { companyId } = requireStudentContext();
    const raw = await getStaffGroups(companyId);
    const out: StaffGroup[] = [];
    for (const item of unwrapList(raw)) {
      if (out.length >= 60) break;
      const row = asRecord(item);
      if (!row) continue;
      const id = idOf(row._id ?? row.id);
      if (!id) continue;
      out.push({
        id,
        name: str(row.groupName, row.name, row.title, 'Group'),
        courseTitle: str(row.courseTitle, row.courseName, asRecord(row.course)?.title, 'Course'),
        // Roster size is not on the list payload — shown inside group detail only.
        studentCount: 0,
        nextSession: toISODay(row.nextSession ?? row.nextClassDate ?? row.nextSessionDate) || '—',
      });
    }
    return out;
  },

  async groupStudents(groupId: string): Promise<GroupStudent[]> {
    const raw = await getGroupStudents(groupId, { limit: 100 });
    return unwrapList(raw)
      .map((item) => {
        const row = asRecord(item);
        if (!row) return null;
        const student = asRecord(row.student) ?? asRecord(row.user) ?? row;
        const id = idOf(student._id ?? student.id ?? row.studentId ?? row._id);
        if (!id) return null;
        const status = str(student.status, row.status).toLowerCase();
        return {
          id,
          name: personName(student),
          email: str(student.email, row.email),
          progress: status.includes('inactive') ? 0 : num(row.progress ?? row.completion),
        } satisfies GroupStudent;
      })
      .filter((item): item is GroupStudent => Boolean(item));
  },

  async groupSessions(groupId: string): Promise<GroupSession[]> {
    const raw = await getGroupSessions(groupId);
    return unwrapList(raw)
      .map((item) => {
        const row = asRecord(item);
        if (!row) return null;
        const id = idOf(row.classId ?? row._id ?? row.id);
        if (!id) return null;
        return {
          id,
          groupId,
          title: str(row.title, row.className, 'Session'),
          date: toISODay(row.classDate ?? row.date),
          startTime: formatClock(row.startTime),
          endTime: formatClock(row.endTime),
          location: str(row.location, row.locationName, row.link ? 'Online' : '') || '—',
        } satisfies GroupSession;
      })
      .filter((item): item is GroupSession => Boolean(item));
  },

  async directory(): Promise<DirectoryUser[]> {
    // Avoid getAllUsersActive — full company dumps freeze the RN bridge.
    let rows: unknown[] = [];
    try {
      rows = unwrapList(await getCalendarUsersLite());
    } catch {
      const settled = await Promise.allSettled([
        getUsersByType({ userType: 'student' }),
        getUsersByType({ userType: 'staff' }),
      ]);
      for (const result of settled) {
        if (result.status === 'fulfilled') rows.push(...unwrapList(result.value));
      }
    }

    const out: DirectoryUser[] = [];
    const seen = new Set<string>();
    for (const item of rows) {
      if (out.length >= 80) break;
      const row = asRecord(item);
      if (!row) continue;
      const id = idOf(row._id ?? row.id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        name: personName(row),
        email: str(row.email),
        role: mapDirectoryRole(row),
        status: mapDirectoryStatus(row),
      });
    }
    return out;
  },

  async coursework(): Promise<CourseworkItem[]> {
    const raw = await getStaffCoursework();
    const out: CourseworkItem[] = [];
    for (const item of unwrapList(raw)) {
      if (out.length >= 50) break;
      const mapped = mapStaffCourseworkItem(item);
      if (mapped) out.push(mapped);
    }
    return out;
  },

  async submissions(assignmentId?: string): Promise<CourseworkSubmission[]> {
    if (!assignmentId) return [];
    const raw = await getCourseworkSubmissions(assignmentId);
    const payload = asRecord(raw)?.data ?? raw;
    const rows = asArray(asRecord(payload)?.rows ?? unwrapList(payload));
    const out: CourseworkSubmission[] = [];
    for (const item of rows) {
      const row = asRecord(item);
      if (!row) continue;
      const student = asRecord(row.student) ?? {};
      const submission = asRecord(row.submission);
      if (!submission) continue;
      const id = idOf(submission._id ?? submission.id);
      if (!id) continue;
      const statusRaw = str(submission.status).toLowerCase();
      let status: CourseworkSubmission['status'] = 'submitted';
      if (statusRaw.includes('grade') || submission.score != null) status = 'graded';
      else if (submission.isLate || statusRaw.includes('late')) status = 'late';
      const files = asArray(submission.files ?? submission.attachments)
        .map(mapSubmissionFile)
        .filter((file): file is CourseworkFile => Boolean(file));
      out.push({
        id,
        assignmentId,
        studentName: personName(student) || 'Student',
        submittedAt: formatCourseworkDate(submission.submittedAt),
        status,
        isLate: Boolean(submission.isLate),
        grade:
          submission.score != null && Number.isFinite(Number(submission.score))
            ? String(submission.score)
            : undefined,
        files,
        comments: mapSubmissionComments(submission.comments),
      });
    }
    return out;
  },

  async invoices(): Promise<Invoice[]> {
    const raw = await getAllPaymentPlans();
    const out: Invoice[] = [];
    for (const item of unwrapList(raw)) {
      if (out.length >= 40) break;
      const row = asRecord(item);
      if (!row) continue;
      const id = idOf(row._id ?? row.id);
      if (!id) continue;
      const student = asRecord(row.studentId) ?? asRecord(row.student) ?? asRecord(row.user);
      const installments = mapInstallments(row);
      out.push({
        id,
        studentName: personName(student) || str(row.studentName, 'Student'),
        studentEmail: str(student?.email, row.studentEmail) || undefined,
        amountLabel: mapInvoiceAmount(row),
        status: mapInvoiceStatus(row),
        issuedOn: formatCourseworkDate(row.createdAt ?? row.issuedOn ?? row.startDate),
        planName: str(row.planName, row.name, row.title, row.courseName) || undefined,
        invoiceNumber: str(row.invoiceNumber, row.invoiceNo, row.number) || undefined,
        dueOn: formatCourseworkDate(row.dueDate ?? row.nextDueDate) || undefined,
        paidOn: formatCourseworkDate(row.paidAt ?? row.paidOn) || undefined,
        notes: stripHtml(str(row.notes, row.description)) || undefined,
        installments: installments.length > 0 ? installments : undefined,
      });
    }
    return out;
  },

  async agreements(): Promise<Agreement[]> {
    const raw = await getAgreementSubmissions({ limit: 50 });
    const out: Agreement[] = [];
    for (const item of unwrapList(raw)) {
      if (out.length >= 50) break;
      const row = asRecord(item);
      if (!row) continue;
      const id = idOf(row._id ?? row.id);
      if (!id) continue;
      const agreement = asRecord(row.agreement);
      const sender = asRecord(row.sender);
      const recipientId =
        idOf(row.recipientId ?? asRecord(row.recipient)?._id ?? row.recipient) ?? undefined;
      const statusRaw = str(row.status);
      const artifacts = mapAgreementArtifacts(row.artifacts, recipientId ?? id);
      out.push({
        id,
        studentName: str(row.recipientName, personName(row.recipient), 'Recipient'),
        studentEmail: str(row.recipientEmail, asRecord(row.recipient)?.email) || undefined,
        title: str(agreement?.title, row.title, 'Agreement'),
        status: mapAgreementStatus(statusRaw),
        statusLabel: statusRaw || undefined,
        submittedOn: formatCourseworkDate(row.createdAt ?? row.signedAt),
        signedOn: formatCourseworkDate(row.signedAt) || undefined,
        expiresOn: formatCourseworkDate(row.expiresAt) || undefined,
        senderName: str(sender?.name, personName(sender)) || undefined,
        deliveryMethod: str(row.deliveryMethod) || undefined,
        agreementType: str(agreement?.type, row.type) || undefined,
        recipientId,
        artifacts: artifacts.length > 0 ? artifacts : undefined,
      });
    }
    return out;
  },

  async shifts(date?: string): Promise<BookingShift[]> {
    // Always scope by date — unfiltered admin/bookings loads every training day ever.
    const day = date || toISODate(new Date());
    const raw = await getAdminPracticalBookings({ date: day });
    const out: BookingShift[] = [];
    const seen = new Set<string>();
    for (const item of unwrapList(raw)) {
      const row = asRecord(item);
      if (!row) continue;
      const bookingId = idOf(row.bookingId ?? row._id ?? row.id);
      const dayId = idOf(row.dayId ?? row.day ?? row.practicalDay) ?? '';
      if (!bookingId || seen.has(`${dayId}:${bookingId}`)) continue;
      seen.add(`${dayId}:${bookingId}`);
      const shift = asRecord(row.shift);
      const student = asRecord(row.student) ?? asRecord(row.user);
      const location = asRecord(row.location);
      const bookedBy = asRecord(row.bookedBy);
      const statusRaw = str(row.status).toLowerCase();
      const cancelled = statusRaw.includes('cancel');
      const seat = Number(row.seat);
      const shiftTime = str(row.shiftTime);
      let startTime = formatClock(shift?.startTime ?? row.startTime);
      let endTime = formatClock(shift?.endTime ?? row.endTime);
      if ((startTime === '—' || endTime === '—') && shiftTime.includes('-')) {
        const [start = '', end = ''] = shiftTime.split('-').map((part) => part.trim());
        if (start) startTime = formatClock(start);
        if (end) endTime = formatClock(end);
      }
      out.push({
        id: `training:${dayId || day}:${bookingId}`,
        dayId,
        bookingId,
        studentId: idOf(student?._id ?? student?.id ?? row.studentId) ?? undefined,
        studentName: personName(student) || str(row.studentName, 'Student'),
        studentEmail: str(student?.email, row.studentEmail) || undefined,
        shiftName: str(shift?.name, shift?.title, row.shiftName, row.shift, 'Training shift'),
        date: toISODay(row.date) || day,
        startTime,
        endTime,
        location: str(row.locationName, location?.title, location?.name, row.location) || '—',
        seat: Number.isFinite(seat) ? seat : undefined,
        status: cancelled ? 'cancelled' : 'active',
        statusLabel: str(row.status, cancelled ? 'Cancelled' : 'Active'),
        attendance: str(row.attendance) || undefined,
        bookedAt: formatCourseworkDate(row.bookedAt ?? row.createdAt) || undefined,
        bookedByName: personName(bookedBy) !== '—' ? personName(bookedBy) : undefined,
        cancelledAt: formatCourseworkDate(row.cancelledAt) || undefined,
        isOverridden: Boolean(shift?.isOverridden ?? row.isOverridden),
      });
    }
    return out.sort(
      (a, b) =>
        a.startTime.localeCompare(b.startTime) || a.studentName.localeCompare(b.studentName),
    );
  },

  async closedDays(): Promise<string[]> {
    const raw = await getCalendarClosures();
    return [...new Set(mapClosureDates(raw).map((item) => item.date))].sort();
  },

  async closeDay(iso: string): Promise<string[]> {
    await addCalendarClosure({
      scope: 'global',
      is_permanent: false,
      date: iso,
      reason: 'Closed via staff app',
    });
    return staffApi.closedDays();
  },

  async openDay(iso: string): Promise<string[]> {
    const raw = await getCalendarClosures();
    const match = mapClosureDates(raw).find((item) => item.date === iso);
    if (match) {
      await deleteCalendarClosure(match.id);
    }
    return staffApi.closedDays();
  },
};

