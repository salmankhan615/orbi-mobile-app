import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { useStaffBookings } from '@/queries/useBookings';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import type { BookingKind } from '@/api/bookings';
import type { MainTabScreenProps } from '@/navigation/types';
import { tokens } from '@/theme';

type Props = MainTabScreenProps<'Bookings'>;

const TABS: { key: BookingKind; label: string }[] = [
  { key: 'class', label: 'Classes' },
  { key: 'training', label: 'Training' },
];

export function StaffBookingsScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const allowed = useHasPermission('view_bookings');
  const { data, isLoading } = useStaffBookings();
  const [tab, setTab] = useState<BookingKind>('class');

  const bookings = data ?? [];
  const classes = useMemo(() => bookings.filter((item) => item.kind === 'class'), [bookings]);
  const training = useMemo(() => bookings.filter((item) => item.kind === 'training'), [bookings]);
  const visible = tab === 'class' ? classes : training;

  return (
    <Screen style={styles.screen}>
      <PageHeader title="Bookings" subtitle="Mark attendance or cancel a seat." />
      {!allowed ? (
        <Text variant="body" color="textMuted">
          You do not have permission to view bookings.
        </Text>
      ) : (
        <>
          <View style={styles.tabs}>
            {TABS.map((item) => {
              const count = item.key === 'class' ? classes.length : training.length;
              const active = tab === item.key;
              return (
                <ScalePressable
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  hapticStyle="select"
                  style={styles.tabPress}
                >
                  <View style={[styles.tab, active && styles.tabActive]}>
                    <Text
                      variant="caption"
                      color={active ? 'secondary' : 'textSecondary'}
                      style={styles.tabLabel}
                    >
                      {item.label}
                      {isLoading ? '' : ` · ${count}`}
                    </Text>
                  </View>
                </ScalePressable>
              );
            })}
          </View>

          {isLoading ? (
            <EntityListSkeleton />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={tab === 'class' ? 'school-outline' : 'fitness-outline'}
              message={
                tab === 'class' ? 'No class bookings for today.' : 'No training bookings for today.'
              }
            />
          ) : (
            <FlatList
              data={visible}
              keyExtractor={(item) => item.id}
              initialNumToRender={12}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews
              contentContainerStyle={{ paddingBottom: tabPadding }}
              renderItem={({ item: booking }) => (
                <EntityRow
                  icon={tab === 'class' ? 'school-outline' : 'fitness-outline'}
                  title={booking.title}
                  subtitle={`${booking.studentName || 'Student'} · ${booking.date} ${booking.startTime}`}
                  badge={{
                    label: booking.attendance ?? booking.status,
                    tone: booking.status === 'cancelled' ? 'danger' : 'success',
                  }}
                  onPress={() =>
                    navigation.navigate('StaffBookingDetail', { bookingId: booking.id })
                  }
                />
              )}
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  tabPress: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: tokens.colors.secondary,
  },
  tabLabel: {
    textAlign: 'center',
  },
});
