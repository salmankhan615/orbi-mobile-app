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
} from '@/api/crm';
import { useAuthStore } from '@/store/useAuthStore';

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
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  attendance?: 'present' | 'absent' | 'late';
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
    title:
      str(row.className, row.title, row.eventType) ||
      classTitles.get(classTypeId) ||
      'Class',
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
    .filter((item) => item?.status !== 'Inactive')
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

  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

function mapStatus(raw: unknown): BookingStatus {
  const status = str(raw).toLowerCase();
  if (status === 'cancelled') return 'cancelled';
  if (status === 'present' || status === 'attended') return 'attended';
  if (status === 'active' || status === 'confirmed' || status === 'booked') return 'confirmed';
  return 'confirmed';
}

function mapClassBookings(calendarRows: unknown[], studentId: string): Booking[] {
  const bookings: Booking[] = [];
  for (const day of calendarRows) {
    const row = asRecord(day);
    if (!row) continue;
    const classId = idOf(row._id ?? row.id) ?? '';
    const date = toISODate(row.classDate ?? row.date);
    const title = str(row.className, row.title, 'Class');
    const startTime = formatClock(row.classStartTime ?? row.startTime);
    const endTime = formatClock(row.classEndTime ?? row.endTime);

    for (const bookingRaw of asArray(row.bookings)) {
      const booking = asRecord(bookingRaw);
      if (!booking) continue;
      const userId = str(booking.user, booking.userId, idOf(booking.user));
      if (userId && userId !== studentId) continue;
      const bookingId = idOf(booking._id ?? booking.id) ?? `${classId}-${userId}`;
      bookings.push({
        id: `class:${bookingId}`,
        slotId: classId,
        studentName: str(asRecord(booking.user)?.name, booking.name, 'Student'),
        studentId,
        kind: 'class',
        title,
        date,
        startTime,
        endTime,
        status: mapStatus(booking.status),
        classId,
        bookingId,
      });
    }

    // Some payloads are already personal booking rows (userId query).
    if (!asArray(row.bookings).length && (row.user != null || row.userId != null || row.status)) {
      const userId = str(row.user, row.userId, idOf(row.user));
      if (userId && userId !== studentId) continue;
      if (!row.status && !userId) continue;
      bookings.push({
        id: `class:${classId || idOf(row._id)}`,
        slotId: classId,
        studentName: 'Student',
        studentId,
        kind: 'class',
        title,
        date,
        startTime,
        endTime,
        status: mapStatus(row.status),
        classId,
        bookingId: idOf(row._id) ?? classId,
      });
    }
  }
  return bookings;
}

function mapPracticalBookings(raw: unknown, studentId: string): Booking[] {
  return asList(raw).map((item, index) => {
    const row = asRecord(item) ?? {};
    const bookingId = idOf(row._id ?? row.bookingId) ?? `pt-${index}`;
    const dayId = str(row.dayId, idOf(row.day), idOf(row.practicalDay));
    const location = asRecord(row.location);
    const shift = asRecord(row.shift);
    return {
      id: `training:${dayId}:${bookingId}`,
      slotId: str(idOf(shift?._id), bookingId),
      studentName: str(asRecord(row.student)?.name, 'Student'),
      studentId,
      kind: 'training' as const,
      title: str(shift?.title, shift?.name, location?.title, row.title, 'Training'),
      date: toISODate(row.date ?? row.classDate ?? row.bookingDate),
      startTime: formatClock(shift?.startTime ?? row.startTime),
      endTime: formatClock(shift?.endTime ?? row.endTime),
      status: mapStatus(row.status),
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
    const [calendarRaw, practicalRaw] = await Promise.all([
      getClassCalendar(studentId).catch(() => getClassCalendar()),
      getMyPracticalBookings(studentId),
    ]);
    const classBookings = mapClassBookings(asList(calendarRaw), studentId);
    const trainingBookings = mapPracticalBookings(practicalRaw, studentId);
    return [...classBookings, ...trainingBookings].sort((a, b) =>
      b.date.localeCompare(a.date),
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
        title: 'Training',
        date,
        startTime: '—',
        endTime: '—',
        status: 'confirmed',
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

    await bookClass(slotId, { seat, user: student.id });
    return {
      id: `class:${slotId}:${student.id}`,
      slotId,
      studentName: student.name,
      studentId: student.id,
      kind: 'class',
      title: 'Class',
      date: new Date().toISOString().slice(0, 10),
      startTime: '—',
      endTime: '—',
      status: 'confirmed',
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
