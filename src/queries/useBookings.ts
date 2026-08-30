import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, type BookingKind } from '@/api/bookings';

export const bookingKeys = {
  all: ['bookings'] as const,
  slots: (kind?: BookingKind) => ['bookings', 'slots', kind ?? 'all'] as const,
  mine: (studentId: string) => ['bookings', 'mine', studentId] as const,
  staff: ['bookings', 'staff'] as const,
  detail: (id: string) => ['bookings', id] as const,
};

export function useBookableSlots(kind?: BookingKind) {
  return useQuery({
    queryKey: bookingKeys.slots(kind),
    queryFn: () => bookingsApi.listSlots(kind),
  });
}

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

export function useBookSlot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, student }: { slotId: string; student: { id: string; name: string } }) =>
      bookingsApi.book(slotId, student),
    onSuccess: () => client.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useCancelBooking() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: () => client.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useMarkAttendance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attendance }: { id: string; attendance: 'present' | 'absent' | 'late' }) =>
      bookingsApi.markAttendance(id, attendance),
    onSuccess: () => client.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}
