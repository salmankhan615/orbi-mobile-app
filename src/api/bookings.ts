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
}

const slots: BookableSlot[] = [
  {
    id: 'slot-1',
    kind: 'class',
    title: 'Sage 50 Session 1',
    date: '2026-08-04',
    startTime: '10:00',
    endTime: '11:30',
    instructor: 'Arslan M',
    seatsLeft: 4,
    mode: 'Online',
  },
  {
    id: 'slot-2',
    kind: 'class',
    title: 'ACCA Skills Tutorial',
    date: '2026-08-05',
    startTime: '13:00',
    endTime: '14:30',
    instructor: 'Amina H',
    seatsLeft: 2,
    mode: 'In-Person',
  },
  {
    id: 'slot-3',
    kind: 'training',
    title: 'Customer Care Workshop',
    date: '2026-08-06',
    startTime: '14:00',
    endTime: '16:00',
    instructor: 'Arslan M',
    seatsLeft: 8,
    mode: 'In-Person',
  },
  {
    id: 'slot-4',
    kind: 'training',
    title: 'Digital Accounts Lab',
    date: '2026-08-08',
    startTime: '09:30',
    endTime: '12:00',
    instructor: 'Amina H',
    seatsLeft: 5,
    mode: 'Online',
  },
];

let bookings: Booking[] = [
  {
    id: 'b1',
    slotId: 'slot-1',
    studentName: 'Sidra Khan',
    studentId: 'user-1',
    kind: 'class',
    title: 'Sage 50 Session 1',
    date: '2026-08-04',
    startTime: '10:00',
    endTime: '11:30',
    status: 'confirmed',
  },
  {
    id: 'b2',
    slotId: 'slot-3',
    studentName: 'Sidra Khan',
    studentId: 'user-1',
    kind: 'training',
    title: 'Customer Care Workshop',
    date: '2026-08-06',
    startTime: '14:00',
    endTime: '16:00',
    status: 'confirmed',
  },
  {
    id: 'b3',
    slotId: 'slot-2',
    studentName: 'Hassan Ali',
    studentId: 'user-3',
    kind: 'class',
    title: 'ACCA Skills Tutorial',
    date: '2026-08-05',
    startTime: '13:00',
    endTime: '14:30',
    status: 'confirmed',
  },
];

function mockDelay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const bookingsApi = {
  listSlots: (kind?: BookingKind): Promise<BookableSlot[]> =>
    mockDelay(kind ? slots.filter((slot) => slot.kind === kind) : slots),
  listMine: (studentId: string): Promise<Booking[]> =>
    mockDelay(bookings.filter((item) => item.studentId === studentId)),
  listAll: (): Promise<Booking[]> => mockDelay([...bookings]),
  getById: (id: string): Promise<Booking | undefined> =>
    mockDelay(bookings.find((item) => item.id === id)),
  book: (slotId: string, student: { id: string; name: string }): Promise<Booking> => {
    const slot = slots.find((item) => item.id === slotId);
    if (!slot) return Promise.reject(new Error('Slot not found'));
    const booking: Booking = {
      id: `b${Date.now()}`,
      slotId,
      studentName: student.name,
      studentId: student.id,
      kind: slot.kind,
      title: slot.title,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'confirmed',
    };
    bookings = [booking, ...bookings];
    slot.seatsLeft = Math.max(0, slot.seatsLeft - 1);
    return mockDelay(booking);
  },
  cancel: (id: string): Promise<Booking | undefined> => {
    bookings = bookings.map((item) =>
      item.id === id ? { ...item, status: 'cancelled' as const } : item,
    );
    return mockDelay(bookings.find((item) => item.id === id));
  },
  markAttendance: (
    id: string,
    attendance: NonNullable<Booking['attendance']>,
  ): Promise<Booking | undefined> => {
    bookings = bookings.map((item) =>
      item.id === id ? { ...item, attendance, status: 'attended' as const } : item,
    );
    return mockDelay(bookings.find((item) => item.id === id));
  },
};
