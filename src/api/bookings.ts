import {
  bookClass,
  bookPracticalTraining,
  cancelClassBooking,
  cancelPracticalBooking,
  getAvailableTrainingShifts,
  getClassAvailability,
  getClassCalendar,
  getCourseSettings,
  getMyPracticalBookings,
  isSettingsActive,
} from '@/api/crm';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPortalDate } from '@/utils/date';

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
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
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

function toISODate(value: unknown): string {
  if (!value) return '';
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

function mapClassSlot(raw: unknown, classTitles: Map<string, string>): BookableSlot | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = idOf(row._id ?? row.id);
  if (!id) return null;
  const date = toISODate(row.classDate ?? row.date);
  if (!date || date < new Date().toISOString().slice(0, 10)) return null;
  const status = str(row.status, row.classStatus).toLowerCase();
  if (status.includes('cancel') || status === 'inactive') return null;
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
            const left = Number(shift.availableSeats ?? shift.seatsLeft ?? shift.remaining ?? 1);
            slots.push({
              id: `training:${location._id}:${shiftId}:${date}`,
              kind: 'training',
              title: str(shift.title, shift.name, location.title, 'Training shift'),
              date,
              startTime: formatClock(shift.startTime ?? shift.start),
              endTime: formatClock(shift.endTime ?? shift.end),
              instructor: str(shift.instructor, shift.trainer, 'Trainer'),
              seatsLeft: Number.isFinite(left) ? left : 1,
              mode: 'In-Person',
              seat: Number(shift.nextSeat ?? 1) || 1,
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
) {
  const classId = idOf(row._id ?? row.id) ?? '';
  const calendarId = calendarIdForRow(row, maps);
  const date = toISODate(row.classDate ?? row.date);
  const bookingDate = toISODate(booking.bookedAt ?? booking.bookingDate ?? booking.createdAt);
  const bookingId = idOf(booking._id ?? booking.id) ?? `${classId}-${studentId}`;
  const seat = Number(booking.seat);
  const attendanceRaw = str(booking.attendance);
  bookings.push({
    id: `class:${bookingId}`,
    slotId: classId,
    studentName: str(asRecord(booking.user)?.name, booking.name, 'Student'),
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

function mapClassBookings(calendarRows: unknown[], studentId: string, maps: TitleMaps): Booking[] {
  const bookings: Booking[] = [];
  for (const day of calendarRows) {
    const row = asRecord(day);
    if (!row) continue;

    const myBookings = asArray(row.myBookings);
    if (myBookings.length > 0) {
      for (const bookingRaw of myBookings) {
        const booking = asRecord(bookingRaw);
        if (!booking) continue;
        const userId = str(booking.user, booking.userId, idOf(booking.user));
        if (userId && userId !== studentId) continue;
        pushClassBooking(bookings, row, booking, studentId, maps);
      }
      continue;
    }

    for (const bookingRaw of asArray(row.bookings)) {
      const booking = asRecord(bookingRaw);
      if (!booking) continue;
      const userId = str(booking.user, booking.userId, idOf(booking.user));
      if (userId && userId !== studentId) continue;
      pushClassBooking(bookings, row, booking, studentId, maps);
    }
  }
  return bookings;
}

function mapPracticalBookings(raw: unknown, studentId: string, maps: TitleMaps): Booking[] {
  return asList(raw).map((item, index) => {
    const row = asRecord(item) ?? {};
    const bookingId = idOf(row._id ?? row.bookingId) ?? `pt-${index}`;
    const dayId = str(row.dayId, idOf(row.day), idOf(row.practicalDay));
    const locationId = idOf(row.location) ?? str(row.location);
    const shift = asRecord(row.shift);
    const shiftId = idOf(shift?._id ?? shift?.id);
    const shiftName = str(shift?.title, shift?.name);
    const date = toISODate(row.date ?? row.classDate ?? row.bookingDate);
    const bookingDate = toISODate(row.bookedAt ?? row.bookingDate ?? row.createdAt);
    const seat = Number(row.seat);
    const attendanceRaw = str(row.attendance);
    const locationLabel =
      maps.locations.get(locationId) || str(asRecord(row.location)?.title, row.locationName) || '—';

    return {
      id: `training:${dayId || bookingId}:${bookingId}`,
      slotId: shiftId ?? bookingId,
      studentName: str(asRecord(row.student)?.name, 'Student'),
      studentId,
      kind: 'training' as const,
      typeLabel: 'Practical Training',
      title: shiftName || locationLabel || 'Training',
      date,
      dateLabel: formatPortalDate(date),
      startTime: formatClock(shift?.startTime ?? row.startTime),
      endTime: formatClock(shift?.endTime ?? row.endTime),
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

export const bookingsApi = {
  async listSlots(kind?: BookingKind): Promise<BookableSlot[]> {
    if (kind === 'training') return listTrainingSlots();
    if (kind === 'class') {
      const [raw, settings] = await Promise.all([getClassCalendar(), getCourseSettings()]);
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

  async listMine(studentId: string): Promise<Booking[]> {
    const [calendarRaw, practicalRaw, settings] = await Promise.all([
      getClassCalendar(studentId),
      getMyPracticalBookings(studentId),
      getCourseSettings().catch(() => ({ classes: [], locations: [], categories: [] })),
    ]);
    const maps = buildTitleMaps(settings);
    const classBookings = mapClassBookings(asList(calendarRaw), studentId, maps);
    const trainingBookings = mapPracticalBookings(practicalRaw, studentId, maps);
    return [...classBookings, ...trainingBookings].sort(
      (a, b) => b.date.localeCompare(a.date) || b.bookingDate.localeCompare(a.bookingDate),
    );
  },

  async listAll(): Promise<Booking[]> {
    const userId = useAuthStore.getState().user?.id ?? '';
    return bookingsApi.listMine(userId);
  },

  async getById(id: string): Promise<Booking | undefined> {
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
    const userId = useAuthStore.getState().user?.id ?? '';
    const booking = await bookingsApi.getById(id);
    if (!booking) throw new Error('Booking not found');

    if (booking.kind === 'class') {
      const classId = booking.classId ?? booking.slotId;
      await cancelClassBooking(classId, userId);
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
    // Staff attendance endpoints differ per kind; keep status locally for now when CRM call unavailable.
    return { ...booking, attendance, status: 'attended' };
  },
};
