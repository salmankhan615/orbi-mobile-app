import {
  bookClass,
  bookPracticalTraining,
  cancelClassBooking,
  cancelPracticalBooking,
  getAdminPracticalBookings,
  getAvailableTrainingShifts,
  getCalendarUsersLite,
  getClassAvailability,
  getClassCalendar,
  getClassCalendarById,
  getCourseSettings,
  getMyPracticalBookings,
  isSettingsActive,
  markClassAttendance,
  markPracticalAttendance,
  type TrainingShiftRaw,
} from '@/api/crm';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPortalDate, getRollingDateRange } from '@/utils/date';

export type BookingKind = 'class' | 'training';
export type BookingStatus = 'confirmed' | 'attended' | 'cancelled' | 'available';

export interface BookableSlot {
  id: string;
  kind: BookingKind;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  instructor: string;
  seatsLeft: number;
  mode: 'Online' | 'In-Person';
  /** First free seat for class booking. */
  seat?: number;
  locationId?: string;
  shiftId?: string;
}

export interface Booking {
  id: string;
  slotId: string;
  studentName: string;
  studentId: string;
  kind: BookingKind;
  /** Portal "Type" column — Class or Practical Training. */
  typeLabel: string;
  title: string;
  date: string;
  /** Portal-style DD/MM/YYYY for the session date. */
  dateLabel: string;
  startTime: string;
  endTime: string;
  /** Portal "Location" column. */
  locationLabel: string;
  /** ISO date when the booking was made. */
  bookingDate: string;
  /** Portal-style DD/MM/YYYY for booking date. */
  bookingDateLabel: string;
  seat?: number;
  status: BookingStatus;
  /** Portal "Status" column — Active, Cancelled, etc. */
  statusLabel: string;
  attendance?: 'present' | 'absent' | 'late';
  /** Portal "Attendance" column. */
  attendanceLabel?: string;
  /** Category / calendar type id (`cateId`) — used by calendar filter. */
  calendarId?: string;
  /** Category title, e.g. ACDAP. */
  calendarLabel?: string;
  /** Training shift id — used by shift filter. */
  shiftId?: string;
  shiftName?: string;
  /** CRM cancel targets */
  classId?: string;
  dayId?: string;
  bookingId?: string;
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

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function personName(raw: unknown): string {
  const row = asRecord(raw);
  if (!row) return '';
  const first = str(row.name, row.firstName);
  const last = str(row.lname, row.lastName);
  return `${first} ${last}`.trim() || str(row.email);
}

function buildUserNameMap(raw: unknown): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of asList(raw)) {
    const row = asRecord(item);
    if (!row) continue;
    const id = idOf(row._id ?? row.id);
    if (!id) continue;
    const label = personName(row);
    if (label) map.set(id, label);
  }
  return map;
}

function bookingStudentName(
  booking: UnknownRecord,
  studentId: string,
  nameById?: Map<string, string>,
): string {
  const user =
    asRecord(booking.user) ??
    asRecord(booking.student) ??
    asRecord(booking.userId) ??
    asRecord(booking.studentId);
  const fromUser = personName(user);
  if (fromUser) return fromUser;
  const fromFields = str(booking.studentName, booking.traineeName, booking.fullName);
  if (fromFields) return fromFields;
  const first = str(booking.name, booking.firstName);
  const last = str(booking.lname, booking.lastName);
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  if (studentId && nameById?.get(studentId)) return nameById.get(studentId)!;
  const userId = str(idOf(booking.user), booking.userId);
  if (userId && nameById?.get(userId)) return nameById.get(userId)!;
  return 'Student';
}

/** Local helper — do not import `toISODate` from `@/utils/date` (name clash). */
function toISODate(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return '';
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

function bookedSeats(row: UnknownRecord): number[] {
  if (Array.isArray(row.bookedSeats)) {
    return row.bookedSeats.map(Number).filter((n) => Number.isFinite(n));
  }
  return asArray(row.bookings)
    .map(asRecord)
    .filter((item) => item && String(item.status) === 'Active')
    .map((item) => Number(item?.seat))
    .filter((n) => Number.isFinite(n));
}

function seatsLeftForClass(row: UnknownRecord): { left: number; nextSeat: number } {
  const limit = Number(row.bookingLimit ?? row.classLimit ?? 0) || 0;
  const booked = bookedSeats(row);
  const available = Array.isArray(row.availableSeats)
    ? row.availableSeats.map(Number).filter((n) => Number.isFinite(n))
    : Array.from({ length: limit }, (_, i) => i + 1).filter((seat) => !booked.includes(seat));
  return { left: available.length, nextSeat: available[0] ?? 1 };
}

/** Occurrence day — prefer classDate/startTime; `date` is often the series start. */
function occurrenceDate(row: UnknownRecord): string {
  for (const value of [row.classDate, row.startTime, row.date]) {
    const iso = toISODate(value);
    if (iso) return iso;
  }
  return '';
}

/** Student already holds an active seat on this class (full `myBookings[]` or slim `myBooking`). */
function hasActiveMyBooking(row: UnknownRecord): boolean {
  const candidates = [asRecord(row.myBooking), ...asArray(row.myBookings).map(asRecord)];
  return candidates.some((item) => item && !/cancel/i.test(str(item.status)));
}

function mapClassSlot(raw: unknown, classTitles: Map<string, string>): BookableSlot | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = idOf(row._id ?? row.id);
  if (!id) return null;
  const date = occurrenceDate(row);
  if (!date || date < new Date().toISOString().slice(0, 10)) return null;
  const status = str(row.status, row.classStatus).toLowerCase();
  if (status.includes('cancel') || status === 'inactive') return null;
  if (hasActiveMyBooking(row)) return null;
  const { left, nextSeat } = seatsLeftForClass(row);
  if (left <= 0) return null;
  const classTypeId = idOf(row.classType) ?? str(row.classType);
  const link = str(row.link, row.classLink);
  return {
    id,
    kind: 'class',
    title: str(row.className, row.title, row.eventType) || classTitles.get(classTypeId) || 'Class',
    date,
    startTime: formatClock(row.startTime ?? row.classStartTime),
    endTime: formatClock(row.endTime ?? row.classEndTime),
    instructor: str(asRecord(row.instructor)?.name, row.instructor, 'Instructor'),
    seatsLeft: left,
    mode: link ? 'Online' : 'In-Person',
    seat: nextSeat,
  };
}

function nextDates(days: number): string[] {
  const out: string[] = [];
  const cursor = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Free seat numbers for a shift — `bookedSeats` on shifts is a count, use `bookedSeatNumbers`. */
function freeTrainingSeats(shift: UnknownRecord): number[] {
  const typed = shift as TrainingShiftRaw;
  const limit = Number(typed.currentLimit ?? typed.defaultLimit ?? 0);
  if (!Number.isFinite(limit) || limit <= 0) return [];
  const booked = new Set(
    asArray(typed.bookedSeatNumbers)
      .map(Number)
      .filter((n) => Number.isFinite(n)),
  );
  return Array.from({ length: limit }, (_, i) => i + 1).filter((n) => !booked.has(n));
}

async function listTrainingSlots(): Promise<BookableSlot[]> {
  const settings = await getCourseSettings();
  const locations = (settings.locations ?? [])
    .filter((item) => isSettingsActive(item?.status))
    .slice(0, 4);
  if (locations.length === 0) return [];

  const dates = nextDates(7);
  const slots: BookableSlot[] = [];

  await Promise.all(
    dates.flatMap((date) =>
      locations.map(async (location) => {
        try {
          const raw = await getAvailableTrainingShifts({ date, location: location._id });
          const payload = asRecord(raw);
          const data = asRecord(payload?.data);
          const list = asArray(data?.shifts).length > 0 ? asArray(data?.shifts) : asList(raw);

          for (const shiftRaw of list) {
            const shift = asRecord(shiftRaw);
            if (!shift) continue;
            const shiftId = idOf(shift._id ?? shift.id);
            if (!shiftId) continue;
            const freeSeats = freeTrainingSeats(shift);
            const reported = Number(shift.availableSeats ?? shift.seatsLeft ?? shift.remaining);
            const left = Number.isFinite(reported) ? reported : freeSeats.length;
            if (left <= 0) continue;
            slots.push({
              id: `training:${location._id}:${shiftId}:${date}`,
              kind: 'training',
              title: str(shift.title, shift.name, location.title, 'Training shift'),
              date,
              startTime: formatClock(shift.startTime ?? shift.start),
              endTime: formatClock(shift.endTime ?? shift.end),
              instructor: str(shift.instructor, shift.trainer, 'Trainer'),
              seatsLeft: left,
              mode: 'In-Person',
              seat: freeSeats[0] ?? (Number(shift.nextSeat) || 1),
              locationId: location._id,
              shiftId,
            });
          }
        } catch {
          // skip failed location/date combo
        }
      }),
    ),
  );

  return slots.sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
}

type TitleMaps = {
  classes: Map<string, string>;
  categories: Map<string, string>;
  locations: Map<string, string>;
  /** classType id → category (calendar) id via settings.classes.classCate */
  classToCategory: Map<string, string>;
};

function buildTitleMaps(settings: Awaited<ReturnType<typeof getCourseSettings>>): TitleMaps {
  const classToCategory = new Map<string, string>();
  for (const item of settings.classes ?? []) {
    if (item.classCate) classToCategory.set(String(item._id), String(item.classCate));
  }
  return {
    classes: new Map((settings.classes ?? []).map((item) => [String(item._id), item.title])),
    categories: new Map((settings.categories ?? []).map((item) => [String(item._id), item.title])),
    locations: new Map((settings.locations ?? []).map((item) => [String(item._id), item.title])),
    classToCategory,
  };
}

function calendarIdForRow(row: UnknownRecord, maps: TitleMaps): string {
  const cateId = idOf(row.cateId) ?? str(row.cateId);
  if (cateId) return cateId;
  const classTypeId = idOf(row.classType) ?? str(row.classType);
  return maps.classToCategory.get(classTypeId) || '';
}

function mapStatus(raw: unknown): BookingStatus {
  const status = str(raw).toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (status === 'present' || status === 'attended') return 'attended';
  if (status === 'active' || status === 'confirmed' || status === 'booked') return 'confirmed';
  return 'confirmed';
}

function mapStatusLabel(raw: unknown): string {
  const status = str(raw);
  if (!status) return 'Active';
  if (/cancel/i.test(status)) return 'Cancelled';
  if (/present|attended/i.test(status)) return 'Attended';
  if (/absent/i.test(status)) return 'Absent';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function mapAttendance(raw: unknown): Booking['attendance'] | undefined {
  const value = str(raw).toLowerCase();
  if (!value) return undefined;
  if (value.includes('present') || value === 'attended') return 'present';
  if (value.includes('absent')) return 'absent';
  if (value.includes('late')) return 'late';
  return undefined;
}

function classTitleForRow(row: UnknownRecord, maps: TitleMaps): string {
  const classTypeId = idOf(row.classType) ?? str(row.classType);
  const cateId = idOf(row.cateId) ?? str(row.cateId);
  return (
    str(row.className, row.title, row.eventType) ||
    maps.classes.get(classTypeId) ||
    maps.categories.get(cateId) ||
    'Class'
  );
}

function classLocationForRow(row: UnknownRecord, maps: TitleMaps): string {
  const locationId = idOf(row.location) ?? str(row.location);
  const fromSettings = maps.locations.get(locationId);
  if (fromSettings) return fromSettings;
  const link = str(row.link, row.classLink);
  if (link) return 'Online';
  return str(row.room, row.locationName) || '—';
}

function pushClassBooking(
  bookings: Booking[],
  row: UnknownRecord,
  booking: UnknownRecord,
  studentId: string,
  maps: TitleMaps,
  nameById?: Map<string, string>,
) {
  const classId = idOf(row._id ?? row.id) ?? '';
  const calendarId = calendarIdForRow(row, maps);
  const date = toISODate(row.classDate ?? row.date);
  const bookingDate = toISODate(booking.bookedAt ?? booking.bookingDate ?? booking.createdAt);
  const bookingId = idOf(booking._id ?? booking.id) ?? `${classId}-${studentId}`;
  const seat = Number(booking.seat);
  const attendanceRaw = str(booking.attendance);
  bookings.push({
    id: `class:${classId}:${bookingId}`,
    slotId: classId,
    studentName: bookingStudentName(booking, studentId, nameById),
    studentId,
    kind: 'class',
    typeLabel: 'Class',
    title: classTitleForRow(row, maps),
    date,
    dateLabel: formatPortalDate(date),
    startTime: formatClock(row.classStartTime ?? row.startTime),
    endTime: formatClock(row.classEndTime ?? row.endTime),
    locationLabel: classLocationForRow(row, maps),
    bookingDate,
    bookingDateLabel: formatPortalDate(bookingDate),
    seat: Number.isFinite(seat) ? seat : undefined,
    status: mapStatus(booking.status),
    statusLabel: mapStatusLabel(booking.status),
    attendance: mapAttendance(attendanceRaw),
    attendanceLabel: attendanceRaw || undefined,
    calendarId: calendarId || undefined,
    calendarLabel: calendarId ? maps.categories.get(calendarId) : undefined,
    classId,
    bookingId,
  });
}

function mapClassBookings(
  calendarRows: unknown[],
  studentId: string,
  maps: TitleMaps,
  nameById?: Map<string, string>,
): Booking[] {
  const bookings: Booking[] = [];
  for (const day of calendarRows) {
    const row = asRecord(day);
    if (!row) continue;

    // `viewAsStudentId` responses carry the student's own seats in `myBookings[]`
    // (slim: single `myBooking`). When either is present it is authoritative —
    // an empty `myBookings` means no booking, so never fall through to `bookings`.
    if (Array.isArray(row.myBookings)) {
      for (const bookingRaw of row.myBookings) {
        const booking = asRecord(bookingRaw);
        if (booking) pushClassBooking(bookings, row, booking, studentId, maps, nameById);
      }
      continue;
    }
    const single = asRecord(row.myBooking);
    if (single) {
      pushClassBooking(bookings, row, single, studentId, maps, nameById);
      continue;
    }

    for (const bookingRaw of asArray(row.bookings)) {
      const booking = asRecord(bookingRaw);
      if (!booking) continue;
      const userId = str(idOf(booking.user), booking.userId, booking.user);
      if (userId && userId !== studentId) continue;
      pushClassBooking(bookings, row, booking, studentId, maps, nameById);
    }
  }
  return bookings;
}

/** Staff roster: every seat on classes in range (no `viewAsStudentId` / slim). */
function mapStaffClassBookings(
  calendarRows: unknown[],
  maps: TitleMaps,
  nameById?: Map<string, string>,
): Booking[] {
  const bookings: Booking[] = [];
  for (const day of calendarRows) {
    const row = asRecord(day);
    if (!row) continue;
    for (const bookingRaw of asArray(row.bookings)) {
      const booking = asRecord(bookingRaw);
      if (!booking) continue;
      const user = asRecord(booking.user) ?? asRecord(booking.student);
      const studentId = str(idOf(booking.user), idOf(user), booking.userId, booking.user);
      if (!studentId) continue;
      pushClassBooking(
        bookings,
        row,
        { ...booking, user: user ?? booking.user },
        studentId,
        maps,
        nameById,
      );
    }
  }
  return bookings;
}

async function listStaffClassBookings(): Promise<Booking[]> {
  // Today only — multi-day full rosters freeze staff tools.
  const day = toISODate(new Date());
  const [calendarRaw, settings, usersLite] = await Promise.all([
    getClassCalendar({ startDate: day, endDate: day }),
    getCourseSettings().catch(() => ({ classes: [], locations: [], categories: [] })),
    getCalendarUsersLite().catch(() => []),
  ]);
  const nameById = buildUserNameMap(usersLite);
  const mapped = mapStaffClassBookings(asList(calendarRaw), buildTitleMaps(settings), nameById);
  return mapped.slice(0, 60);
}

async function listStaffTrainingBookings(): Promise<Booking[]> {
  // Optional / secondary — keep off the critical path of listAll.
  const date = toISODate(new Date());
  const [raw, settings] = await Promise.all([
    getAdminPracticalBookings({ date }),
    getCourseSettings().catch(() => ({ classes: [], locations: [], categories: [] })),
  ]);
  return mapAdminPracticalBookings(raw, buildTitleMaps(settings)).slice(0, 40);
}

/** Fix student id/name on admin practical rows (student populated). */
function mapAdminPracticalBookings(raw: unknown, maps: TitleMaps): Booking[] {
  return asList(raw).map((item, index) => {
    const row = asRecord(item) ?? {};
    const bookingId = idOf(row.bookingId ?? row._id ?? row.id) ?? `pt-${index}`;
    const dayId = idOf(row.dayId ?? row.day ?? row.practicalDay) ?? '';
    const shiftRecord = asRecord(row.shift);
    const shiftId = idOf(shiftRecord?._id ?? shiftRecord?.id ?? row.shiftId) ?? '';
    const shiftName = str(shiftRecord?.name, shiftRecord?.title, row.shiftName, row.shift);
    const [shiftStart, shiftEnd] = splitShiftTime(row.shiftTime);
    const locationRecord = asRecord(row.location);
    const locationId = idOf(row.location ?? row.locationId) ?? '';
    const locationLabel =
      str(row.locationName, locationRecord?.title, locationRecord?.name) ||
      maps.locations.get(locationId) ||
      '—';
    const date = toISODate(row.date ?? row.classDate ?? row.trainingDate);
    const bookingDate = toISODate(row.bookedAt ?? row.bookingDate ?? row.createdAt);
    const seat = Number(row.seat);
    const attendanceRaw = str(row.attendance);
    const studentRecord = asRecord(row.student) ?? asRecord(row.user);
    const studentId = str(idOf(studentRecord), idOf(row.student), row.studentId);

    return {
      id: `training:${dayId || date || bookingId}:${bookingId}`,
      slotId: shiftId || bookingId,
      studentName: bookingStudentName(row, studentId),
      studentId: studentId || 'unknown',
      kind: 'training' as const,
      typeLabel: 'Practical Training',
      title: shiftName || locationLabel || 'Training',
      date,
      dateLabel: formatPortalDate(date),
      startTime: formatClock(shiftRecord?.startTime ?? (shiftStart || row.startTime)),
      endTime: formatClock(shiftRecord?.endTime ?? (shiftEnd || row.endTime)),
      locationLabel,
      bookingDate,
      bookingDateLabel: formatPortalDate(bookingDate),
      seat: Number.isFinite(seat) ? seat : undefined,
      status: mapStatus(row.status),
      statusLabel: mapStatusLabel(row.status),
      attendance: mapAttendance(attendanceRaw),
      attendanceLabel: attendanceRaw || undefined,
      shiftId: shiftId || undefined,
      shiftName: shiftName || undefined,
      dayId: dayId || undefined,
      bookingId,
    };
  });
}

/** `shiftTime` arrives as "09:00 - 13:00" on flattened practical rows. */
function splitShiftTime(value: unknown): [string, string] {
  const raw = str(value);
  if (!raw.includes('-')) return ['', ''];
  const [start = '', end = ''] = raw.split('-').map((part) => part.trim());
  return [start, end];
}

/**
 * Practical rows come in two shapes:
 * - flattened (`my-bookings` / `calendar`): `bookingId`, `dayId`, `shift` (name),
 *   `shiftTime`, `locationName`, `date`, `seat`, `status`, `attendance`
 * - populated (`{ _id, day, shift: { _id, name, startTime, endTime }, location: { _id, title } }`)
 */
function mapPracticalBookings(raw: unknown, studentId: string, maps: TitleMaps): Booking[] {
  return asList(raw).map((item, index) => {
    const row = asRecord(item) ?? {};
    const bookingId = idOf(row.bookingId ?? row._id ?? row.id) ?? `pt-${index}`;
    const dayId = idOf(row.dayId ?? row.day ?? row.practicalDay) ?? '';
    const shiftRecord = asRecord(row.shift);
    const shiftId = idOf(shiftRecord?._id ?? shiftRecord?.id ?? row.shiftId) ?? '';
    const shiftName = str(shiftRecord?.name, shiftRecord?.title, row.shiftName, row.shift);
    const [shiftStart, shiftEnd] = splitShiftTime(row.shiftTime);
    const locationRecord = asRecord(row.location);
    const locationId = idOf(row.location ?? row.locationId) ?? '';
    const locationLabel =
      str(row.locationName, locationRecord?.title, locationRecord?.name) ||
      maps.locations.get(locationId) ||
      '—';
    const date = toISODate(row.date ?? row.classDate ?? row.trainingDate);
    const bookingDate = toISODate(row.bookedAt ?? row.bookingDate ?? row.createdAt);
    const seat = Number(row.seat);
    const attendanceRaw = str(row.attendance);
    const studentRecord = asRecord(row.student) ?? asRecord(row.user);

    return {
      id: `training:${dayId || date || bookingId}:${bookingId}`,
      slotId: shiftId || bookingId,
      studentName: str(studentRecord?.name, row.studentName, 'Student'),
      studentId,
      kind: 'training' as const,
      typeLabel: 'Practical Training',
      title: shiftName || locationLabel || 'Training',
      date,
      dateLabel: formatPortalDate(date),
      startTime: formatClock(shiftRecord?.startTime ?? (shiftStart || row.startTime)),
      endTime: formatClock(shiftRecord?.endTime ?? (shiftEnd || row.endTime)),
      locationLabel,
      bookingDate,
      bookingDateLabel: formatPortalDate(bookingDate),
      seat: Number.isFinite(seat) ? seat : undefined,
      status: mapStatus(row.status),
      statusLabel: mapStatusLabel(row.status),
      attendance: mapAttendance(attendanceRaw),
      attendanceLabel: attendanceRaw || undefined,
      shiftId: shiftId || undefined,
      shiftName: shiftName || undefined,
      dayId: dayId || undefined,
      bookingId,
    };
  });
}

const PRACTICAL_PAGE_SIZE = 50;
const PRACTICAL_MAX_PAGES = 20;

/**
 * `my-bookings` is paginated — walk every page so the list and filters see all
 * rows. Stops on `count`/`totalPages` when the server reports them, otherwise on
 * a short page. Rows are de-duplicated by `_id` in case paging is ignored.
 */
async function fetchAllPracticalBookings(): Promise<unknown[]> {
  const rows: unknown[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= PRACTICAL_MAX_PAGES; page += 1) {
    const response = await getMyPracticalBookings({ page, limit: PRACTICAL_PAGE_SIZE });
    const list = asList(response);
    let added = 0;
    for (const item of list) {
      const id = idOf(asRecord(item)?._id ?? asRecord(item)?.bookingId);
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      rows.push(item);
      added += 1;
    }
    const total = Number(response?.count ?? response?.total);
    const totalPages = Number(response?.totalPages ?? response?.pages);
    if (list.length === 0 || added === 0) break;
    if (Number.isFinite(totalPages) && page >= totalPages) break;
    if (Number.isFinite(total) && rows.length >= total) break;
    if (
      !Number.isFinite(total) &&
      !Number.isFinite(totalPages) &&
      list.length < PRACTICAL_PAGE_SIZE
    ) {
      break;
    }
  }
  return rows;
}

export const bookingsApi = {
  async listSlots(kind?: BookingKind): Promise<BookableSlot[]> {
    if (kind === 'training') return listTrainingSlots();
    if (kind === 'class') {
      const range = getRollingDateRange(0, 3);
      const [raw, settings] = await Promise.all([
        getClassCalendar({
          viewAsStudentId: useAuthStore.getState().user?.id,
          startDate: range.startDate,
          endDate: range.endDate,
        }),
        getCourseSettings(),
      ]);
      const classTitles = new Map(
        (settings.classes ?? []).map((item) => [String(item._id), item.title]),
      );
      return asList(raw)
        .map((item) => mapClassSlot(item, classTitles))
        .filter((item): item is BookableSlot => Boolean(item))
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
        .slice(0, 80);
    }
    const [classes, training] = await Promise.all([
      bookingsApi.listSlots('class'),
      bookingsApi.listSlots('training'),
    ]);
    return [...classes, ...training];
  },

  async listMineTraining(studentId: string): Promise<Booking[]> {
    const [practicalRows, settings] = await Promise.all([
      fetchAllPracticalBookings(),
      getCourseSettings().catch(() => ({ classes: [], locations: [], categories: [] })),
    ]);
    return mapPracticalBookings(practicalRows, studentId, buildTitleMaps(settings));
  },

  async listMineClasses(studentId: string): Promise<Booking[]> {
    const range = getRollingDateRange(6, 12);
    const [calendarRaw, settings] = await Promise.all([
      getClassCalendar({
        viewAsStudentId: studentId,
        startDate: range.startDate,
        endDate: range.endDate,
      }),
      getCourseSettings().catch(() => ({ classes: [], locations: [], categories: [] })),
    ]);
    return mapClassBookings(asList(calendarRaw), studentId, buildTitleMaps(settings));
  },

  /** Both kinds merged; throws only when neither list could be loaded. */
  async listMine(studentId: string): Promise<Booking[]> {
    const results = await Promise.allSettled([
      bookingsApi.listMineClasses(studentId),
      bookingsApi.listMineTraining(studentId),
    ]);
    if (results.every((result) => result.status === 'rejected')) {
      const first = results[0] as PromiseRejectedResult;
      throw first.reason instanceof Error ? first.reason : new Error('Could not load bookings');
    }
    const [classBookings, trainingBookings] = results.map((result) =>
      result.status === 'fulfilled' ? result.value : ([] as Booking[]),
    );
    return [...classBookings, ...trainingBookings].sort(
      (a, b) => b.date.localeCompare(a.date) || b.bookingDate.localeCompare(a.bookingDate),
    );
  },

  async listAll(): Promise<Booking[]> {
    // Classes first — training is a separate, lighter follow-up so the list can paint.
    try {
      const classBookings = await listStaffClassBookings();
      const training = await listStaffTrainingBookings().catch(() => [] as Booking[]);
      return [...classBookings, ...training].sort(
        (a, b) => b.date.localeCompare(a.date) || b.bookingDate.localeCompare(a.bookingDate),
      );
    } catch (error) {
      throw error instanceof Error ? error : new Error('Could not load bookings');
    }
  },

  async getById(id: string): Promise<Booking | undefined> {
    const role = useAuthStore.getState().user?.role;
    if (role === 'staff') {
      // Prefer a single class fetch — never re-run the full roster list here.
      if (id.startsWith('class:')) {
        const parts = id.split(':');
        const classId = parts.length >= 3 ? parts[1] : parts[1];
        const bookingKey = parts.length >= 3 ? parts.slice(2).join(':') : parts[1];
        if (!classId) return undefined;
        try {
          const [raw, settings, usersLite] = await Promise.all([
            getClassCalendarById(classId),
            getCourseSettings().catch(() => ({
              classes: [],
              locations: [],
              categories: [],
            })),
            getCalendarUsersLite().catch(() => []),
          ]);
          const roster = mapStaffClassBookings(
            [raw],
            buildTitleMaps(settings),
            buildUserNameMap(usersLite),
          );
          return (
            roster.find((item) => item.id === id || item.bookingId === bookingKey) ?? roster[0]
          );
        } catch {
          return undefined;
        }
      }
      if (id.startsWith('training:')) {
        const [, dayId, bookingId] = id.split(':');
        if (!dayId || !bookingId) return undefined;
        // Admin list needs a date; dayId is not always a date — try today.
        const raw = await getAdminPracticalBookings({ date: toISODate(new Date()) });
        const maps = buildTitleMaps(
          await getCourseSettings().catch(() => ({
            classes: [],
            locations: [],
            categories: [],
          })),
        );
        return mapAdminPracticalBookings(raw, maps).find(
          (item) => item.id === id || (item.dayId === dayId && item.bookingId === bookingId),
        );
      }
      return undefined;
    }
    const userId = useAuthStore.getState().user?.id ?? '';
    const mine = await bookingsApi.listMine(userId);
    return mine.find((item) => item.id === id);
  },

  async book(
    slotId: string,
    student: { id: string; name: string },
    options?: { seat?: number },
  ): Promise<Booking> {
    if (slotId.startsWith('training:')) {
      const [, locationId, shiftId, date] = slotId.split(':');
      if (!locationId || !shiftId || !date) throw new Error('Invalid training slot');
      const seat = options?.seat ?? 1;
      await bookPracticalTraining({
        location: locationId,
        shift: shiftId,
        date,
        seat,
        studentId: student.id,
      });
      return {
        id: `training:${date}:${shiftId}`,
        slotId,
        studentName: student.name,
        studentId: student.id,
        kind: 'training',
        typeLabel: 'Practical Training',
        title: 'Training',
        date,
        dateLabel: formatPortalDate(date),
        startTime: '—',
        endTime: '—',
        locationLabel: '—',
        bookingDate: new Date().toISOString().slice(0, 10),
        bookingDateLabel: formatPortalDate(new Date()),
        status: 'confirmed',
        statusLabel: 'Active',
      };
    }

    let seat = options?.seat ?? 1;
    try {
      const availability = asRecord(await getClassAvailability(slotId, student.id));
      const { nextSeat } = seatsLeftForClass(availability ?? { _id: slotId });
      seat = options?.seat ?? nextSeat;
    } catch {
      // use provided/default seat
    }

    await bookClass(slotId, { user: student.id, seat });
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: `class:${slotId}:${student.id}`,
      slotId,
      studentName: student.name,
      studentId: student.id,
      kind: 'class',
      typeLabel: 'Class',
      title: 'Class',
      date: today,
      dateLabel: formatPortalDate(today),
      startTime: '—',
      endTime: '—',
      locationLabel: '—',
      bookingDate: today,
      bookingDateLabel: formatPortalDate(today),
      status: 'confirmed',
      statusLabel: 'Active',
      classId: slotId,
    };
  },

  async cancel(id: string): Promise<Booking | undefined> {
    const booking = await bookingsApi.getById(id);
    if (!booking) throw new Error('Booking not found');
    const selfId = useAuthStore.getState().user?.id ?? '';
    const targetUserId =
      useAuthStore.getState().user?.role === 'staff' ? booking.studentId : selfId;

    if (booking.kind === 'class') {
      const classId = booking.classId ?? booking.slotId;
      await cancelClassBooking(classId, targetUserId);
    } else {
      const dayId = booking.dayId;
      const bookingId = booking.bookingId;
      if (!dayId || !bookingId) throw new Error('Missing training booking ids');
      await cancelPracticalBooking(dayId, bookingId);
    }

    return { ...booking, status: 'cancelled' };
  },

  async markAttendance(
    id: string,
    attendance: NonNullable<Booking['attendance']>,
  ): Promise<Booking | undefined> {
    const booking = await bookingsApi.getById(id);
    if (!booking) return undefined;
    // CRM class + PT attendance accept Present | Absent only.
    const crmLabel: 'Present' | 'Absent' =
      attendance === 'absent' ? 'Absent' : 'Present';

    if (booking.kind === 'class' && (booking.classId ?? booking.slotId)) {
      await markClassAttendance(booking.classId ?? booking.slotId, {
        user: booking.studentId,
        attendance: crmLabel,
      });
    } else if (booking.kind === 'training') {
      const dayId = booking.dayId;
      const bookingId = booking.bookingId;
      if (!dayId || !bookingId) throw new Error('Missing training booking ids');
      await markPracticalAttendance(dayId, bookingId, crmLabel);
    }

    return {
      ...booking,
      attendance,
      attendanceLabel: crmLabel,
      status: 'attended',
    };
  },
};
