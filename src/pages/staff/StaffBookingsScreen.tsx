import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScalePressable } from '@/components/custom/ScalePressable';
import {
  DateRangePicker,
  type DateRange,
} from '@/features/bookings/components/DateRangePicker';
import { useStaffBookings } from '@/queries/useBookings';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { formatPortalDate, toISODate } from '@/utils/date';
import type { BookingKind, StaffBookingSession } from '@/api/bookings';
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
  const today = toISODate(new Date());
  const [range, setRange] = useState<DateRange>({ startDate: today, endDate: today });
  const [tab, setTab] = useState<BookingKind>('class');
  const { data, isLoading } = useStaffBookings(range);

  const sessions = data ?? [];
  const classes = useMemo(() => sessions.filter((item) => item.kind === 'class'), [sessions]);
  const training = useMemo(() => sessions.filter((item) => item.kind === 'training'), [sessions]);
  const visible = tab === 'class' ? classes : training;

  function openSession(session: StaffBookingSession) {
    if (session.kind === 'training') {
      navigation.navigate('TrainingLocationBookings', {
        date: session.date || range.startDate,
        locationName: session.locationName || session.locationLabel || 'Location',
        locationId: session.locationId,
        dayId: session.dayId,
      });
      return;
    }
    if (session.classId) {
      navigation.navigate('ClassBookings', {
        classId: session.classId,
        title: session.title,
        date: session.date,
        dateLabel: session.dateLabel,
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.locationLabel,
      });
    }
  }

  return (
    <Screen style={styles.screen}>
      <PageHeader title="Bookings" subtitle="Open a class or location to manage seats." />
      {!allowed ? (
        <Text variant="body" color="textMuted">
          You do not have permission to view bookings.
        </Text>
      ) : (
        <>
          <DateRangePicker value={range} onChange={setRange} />

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
                tab === 'class'
                  ? 'No class sessions in this date range.'
                  : 'No training locations in this date range.'
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
              renderItem={({ item: session }) => (
                <EntityRow
                  icon={tab === 'class' ? 'school-outline' : 'fitness-outline'}
                  title={session.title}
                  subtitle={`${session.locationLabel} · ${session.startTime}–${session.endTime}`}
                  meta={session.dateLabel || formatPortalDate(session.date)}
                  badge={{
                    label: `${session.bookingCount} booked`,
                    tone: session.bookingCount > 0 ? 'success' : 'neutral',
                  }}
                  onPress={() => openSession(session)}
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
