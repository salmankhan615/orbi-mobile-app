import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelClassBooking, cancelPracticalBooking, getClassAvailability } from '@/api/crm';
import { bookingsApi, type BookingKind } from '@/api/bookings';
import { trainingApi } from '@/api/training';
import { sessionsKeys } from '@/queries/useSessions';
import { requireUserId } from '@/api/sessionUser';

export const bookingKeys = {
  all: ['bookings'] as const,
  slots: (kind?: BookingKind) => ['bookings', 'slots', kind ?? 'all'] as const,
  mine: (studentId: string) => ['bookings', 'mine', studentId] as const,
  mineTraining: (studentId: string) => ['bookings', 'mine', studentId, 'training'] as const,
  mineClasses: (studentId: string) => ['bookings', 'mine', studentId, 'class'] as const,
  staff: ['bookings', 'staff'] as const,
  detail: (id: string) => ['bookings', id] as const,
  availability: (classId: string) => ['bookings', 'availability', classId] as const,
  trainingLocations: ['bookings', 'training', 'locations'] as const,
  trainingShifts: (date: string, locationId: string) =>
    ['bookings', 'training', 'shifts', date, locationId] as const,
};

function invalidateBookingQueries(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: bookingKeys.all });
  client.invalidateQueries({ queryKey: sessionsKeys.all });
  client.invalidateQueries({ queryKey: ['bootstrap'] });
}

export function useBookableSlots(kind?: BookingKind) {
  return useQuery({
    queryKey: bookingKeys.slots(kind),
    queryFn: () => bookingsApi.listSlots(kind),
  });
}

/** Classes + practical training in one query so the list renders both together. */
export function useMyBookings(studentId: string) {
  return useQuery({
    queryKey: bookingKeys.mine(studentId),
    queryFn: () => bookingsApi.listMine(studentId),
    enabled: Boolean(studentId),
  });
}

export function useStaffBookings() {
  return useQuery({
    queryKey: bookingKeys.staff,
    queryFn: bookingsApi.listAll,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingsApi.getById(id),
    enabled: Boolean(id),
  });
}

/** Seat map for Booking Details — authoritative availableSeats[]. */
export function useClassAvailability(classId: string, enabled = true) {
  return useQuery({
    queryKey: bookingKeys.availability(classId),
    queryFn: async () => {
      const userId = requireUserId();
      return getClassAvailability(classId, userId);
    },
    enabled: Boolean(classId) && enabled,
  });
}

export function useTrainingLocations() {
  return useQuery({
    queryKey: bookingKeys.trainingLocations,
    queryFn: () => trainingApi.listLocations(),
  });
}

export function useAvailableTrainingShifts(date: string, locationId: string) {
  return useQuery({
    queryKey: bookingKeys.trainingShifts(date, locationId),
    queryFn: () => trainingApi.listShifts(date, locationId),
    enabled: Boolean(date && locationId),
  });
}

export function useBookTrainingShift() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: trainingApi.book,
    onSuccess: (_data, vars) => {
      invalidateBookingQueries(client);
      client.invalidateQueries({
        queryKey: bookingKeys.trainingShifts(vars.date, vars.locationId),
      });
    },
  });
}

export function useBookSlot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      slotId,
      student,
      seat,
    }: {
      slotId: string;
      student: { id: string; name: string };
      seat?: number;
    }) => bookingsApi.book(slotId, student, { seat }),
    onSuccess: (_data, vars) => {
      invalidateBookingQueries(client);
      client.invalidateQueries({ queryKey: bookingKeys.availability(vars.slotId) });
    },
  });
}

export function useCancelBooking() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: () => invalidateBookingQueries(client),
  });
}

/** Cancel the current user's seat from Session / Booking Details. */
export function useCancelSessionBooking() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (session: { id: string; kind?: 'class' | 'training' }) => {
      if (session.kind === 'training') {
        const parts = session.id.split(':');
        const dayId = parts[1];
        const bookingId = parts[2];
        if (!dayId || !bookingId) throw new Error('Missing training booking ids');
        return cancelPracticalBooking(dayId, bookingId);
      }
      const userId = requireUserId();
      return cancelClassBooking(session.id, userId);
    },
    onSuccess: (_data, session) => {
      invalidateBookingQueries(client);
      if (session.kind !== 'training') {
        client.invalidateQueries({ queryKey: bookingKeys.availability(session.id) });
      }
    },
  });
}

/** @deprecated Prefer useCancelSessionBooking for calendar details. */
export function useCancelClassBooking() {
  return useCancelSessionBooking();
}

export function useMarkAttendance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attendance }: { id: string; attendance: 'present' | 'absent' | 'late' }) =>
      bookingsApi.markAttendance(id, attendance),
    onSuccess: () => client.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}
