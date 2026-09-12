import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { BookingPortalRow } from '@/features/bookings/components/BookingPortalRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { BookingStatsBar } from '@/features/bookings/components/BookingStatsBar';
import { FilterSelectRow, SegmentedFilter } from '@/features/bookings/components/BookingFilters';
import {
  calendarFilterOptions,
  computeBookingStats,
  filterBookingsByCalendar,
  filterBookingsByKind,
  filterBookingsByShift,
  shiftFilterOptions,
  type BookingKindFilter,
} from '@/features/bookings/bookingFilters';
import { useMyBookings } from '@/queries/useBookings';
import { useCalendars } from '@/queries/useCalendars';
import { useAuthStore } from '@/store/useAuthStore';

/** Rows shown per page — matches the portal table page size. */
const PAGE_SIZE = 10;

const KIND_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'class', label: 'Classes' },
  { id: 'training', label: 'Training' },
];

export function MyBookingsScreen() {
  const user = useAuthStore((state) => state.user);
  const { data: bookings, isLoading, isError } = useMyBookings(user?.id ?? '');
  const { data: calendars } = useCalendars();

  const [kindFilter, setKindFilter] = useState<BookingKindFilter>('all');
  const [calendarFilter, setCalendarFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const calendarOptions = useMemo(() => calendarFilterOptions(calendars ?? []), [calendars]);
  const shiftOptions = useMemo(() => shiftFilterOptions(bookings ?? []), [bookings]);

  const filtered = useMemo(() => {
    let list = filterBookingsByKind(bookings ?? [], kindFilter);
    list = filterBookingsByCalendar(list, calendarFilter);
    list = filterBookingsByShift(list, shiftFilter);
    return list;
  }, [bookings, kindFilter, calendarFilter, shiftFilter]);

  const stats = useMemo(() => computeBookingStats(filtered), [filtered]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function handleKindChange(id: string) {
    const next = id as BookingKindFilter;
    setKindFilter(next);
    if (next === 'training') setCalendarFilter('all');
    if (next === 'class') setShiftFilter('all');
    setVisibleCount(PAGE_SIZE);
  }

  function handleCalendarChange(id: string) {
    setCalendarFilter(id);
    setVisibleCount(PAGE_SIZE);
  }

  function handleShiftChange(id: string) {
    setShiftFilter(id);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <StackScreen title="My Bookings">
      <View style={styles.filters}>
        <SegmentedFilter options={KIND_OPTIONS} value={kindFilter} onChange={handleKindChange} />
        {kindFilter !== 'training' ? (
          <FilterSelectRow
            label="Calendar"
            value={calendarFilter}
            options={calendarOptions}
            onChange={handleCalendarChange}
          />
        ) : null}
        {kindFilter !== 'class' ? (
          <FilterSelectRow
            label="Shift"
            value={shiftFilter}
            options={shiftOptions}
            onChange={handleShiftChange}
          />
        ) : null}
      </View>

      <BookingStatsBar stats={stats} />

      {isLoading ? (
        <EntityListSkeleton rows={4} />
      ) : isError ? (
        <Text variant="body" color="danger" style={styles.message}>
          Could not load bookings.
        </Text>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No matching bookings"
          message="Try a different filter or book a class to get started."
        />
      ) : (
        <View style={styles.list}>
          {visible.map((booking, index) => (
            <BookingPortalRow key={booking.id} booking={booking} index={index} />
          ))}
          <Text variant="caption" color="textMuted" style={styles.pageInfo}>
            Showing {visible.length} of {filtered.length}
          </Text>
          {hasMore ? (
            <Button
              label="Load more"
              variant="outline"
              onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
            />
          ) : null}
        </View>
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  list: {
    marginTop: tokens.spacing.xl,
  },
  message: {
    marginTop: tokens.spacing.lg,
  },
  pageInfo: {
    textAlign: 'center',
    marginVertical: tokens.spacing.md,
  },
});
