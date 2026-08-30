import { Alert } from 'react-native';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import { Text } from '@/components/ui/Text';
import { useMyBookings, useCancelBooking } from '@/queries/useBookings';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import type { BadgeTone } from '@/components/ui/Badge';
import type { BookingStatus } from '@/api/bookings';

const STATUS_TONE: Record<BookingStatus, BadgeTone> = {
  confirmed: 'success',
  attended: 'primary',
  cancelled: 'danger',
  available: 'neutral',
};

export function MyBookingsScreen() {
  const user = useAuthStore((state) => state.user);
  const { data: bookings } = useMyBookings(user?.id ?? '');
  const cancel = useCancelBooking();
  const showToast = useToastStore((state) => state.show);

  function handleCancel(id: string, title: string) {
    Alert.alert('Cancel booking', `Cancel ${title}?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: () =>
          cancel.mutate(id, {
            onSuccess: () => showToast('Booking cancelled', 'neutral'),
          }),
      },
    ]);
  }

  return (
    <StackScreen title="My Bookings">
      {(bookings ?? []).length === 0 ? (
        <Text variant="body" color="textMuted">
          You have no bookings yet.
        </Text>
      ) : (
        (bookings ?? []).map((booking) => (
          <EntityRow
            key={booking.id}
            icon={booking.kind === 'class' ? 'school-outline' : 'fitness-outline'}
            title={booking.title}
            subtitle={`${booking.date} · ${booking.startTime}–${booking.endTime}`}
            badge={{ label: booking.status, tone: STATUS_TONE[booking.status] }}
            onPress={
              booking.status === 'confirmed'
                ? () => handleCancel(booking.id, booking.title)
                : undefined
            }
          />
        ))
      )}
    </StackScreen>
  );
}
