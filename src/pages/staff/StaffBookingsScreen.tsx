import { ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { PageHeader } from '@/components/ui/PageHeader';
import { useStaffBookings } from '@/queries/useBookings';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothScrollProps } from '@/utils/scroll';
import type { MainTabScreenProps } from '@/navigation/types';
import { tokens } from '@/theme';

type Props = MainTabScreenProps<'Bookings'>;

export function StaffBookingsScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const allowed = useHasPermission('view_bookings');
  const { data, isLoading } = useStaffBookings();
  const bookings = data ?? [];

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        {...smoothScrollProps}
      >
        <PageHeader title="Bookings" subtitle="Mark attendance or cancel a class booking." />
        {!allowed ? (
          <Text variant="body" color="textMuted">
            You do not have permission to view bookings.
          </Text>
        ) : isLoading ? (
          <EntityListSkeleton />
        ) : bookings.length === 0 ? (
          <EmptyState icon="clipboard-outline" message="No bookings yet." />
        ) : (
          bookings.map((booking) => (
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  content: {},
});
