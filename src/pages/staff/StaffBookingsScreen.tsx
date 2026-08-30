import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EntityRow } from '@/components/custom/EntityRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { useStaffBookings } from '@/queries/useBookings';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { MainTabScreenProps } from '@/navigation/types';
import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';

type Props = MainTabScreenProps<'Bookings'>;

export function StaffBookingsScreen({ navigation }: Props) {
  const allowed = useHasPermission('view_bookings');
  const { data } = useStaffBookings();

  return (
    <Screen style={styles.screen}>
      <PageHeader title="Bookings" subtitle="Mark attendance or cancel a class booking." />
      {!allowed ? (
        <Text variant="body" color="textMuted">
          You do not have permission to view bookings.
        </Text>
      ) : (
        (data ?? []).map((booking) => (
          <EntityRow
            key={booking.id}
            icon="clipboard-outline"
            title={booking.title}
            subtitle={`${booking.studentName} · ${booking.date} ${booking.startTime}`}
            badge={{
              label: booking.attendance ?? booking.status,
              tone: booking.status === 'cancelled' ? 'danger' : 'success',
            }}
            onPress={() => navigation.navigate('StaffBookingDetail', { bookingId: booking.id })}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
});
