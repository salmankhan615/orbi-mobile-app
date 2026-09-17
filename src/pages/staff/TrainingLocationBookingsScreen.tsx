import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { cancelPracticalBooking, markPracticalAttendance } from '@/api/crm';
import { staffApi, type BookingShift } from '@/api/staff';
import { staffKeys } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { formatPortalDate } from '@/utils/date';
import { haptics } from '@/utils/haptics';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'TrainingLocationBookings'>;

export function TrainingLocationBookingsScreen({ route }: Props) {
  const { date, locationName, locationId, dayId } = route.params;
  const canAttend = useHasPermission('mark_attendance');
  const canCancel = useHasPermission('cancel_booking');
  const showToast = useToastStore((state) => state.show);
  const client = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: [...staffKeys.shifts, date, dayId || locationId || locationName || 'all'],
    queryFn: async () => {
      const rows = await staffApi.shifts(date);
      return rows.filter((row) => {
        if (dayId && row.dayId) return row.dayId === dayId;
        if (locationId && row.locationId) return row.locationId === locationId;
        if (!locationName) return true;
        return row.location.toLowerCase() === locationName.toLowerCase();
      });
    },
  });

  const bookings = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (row) =>
        row.studentName.toLowerCase().includes(q) ||
        (row.studentEmail ?? '').toLowerCase().includes(q),
    );
  }, [bookings, search]);

  const byShift = useMemo(() => {
    const map = new Map<string, BookingShift[]>();
    for (const row of filtered) {
      const key = `${row.shiftName}|${row.startTime}|${row.endTime}`;
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, rows]) => {
      const [shiftName, startTime, endTime] = key.split('|');
      return { shiftName, startTime, endTime, rows };
    });
  }, [filtered]);

  const activeCount = bookings.filter((row) => row.status === 'active').length;

  const attendMutation = useMutation({
    mutationFn: ({
      dayId,
      bookingId,
      value,
    }: {
      dayId: string;
      bookingId: string;
      value: 'Present' | 'Absent';
    }) => markPracticalAttendance(dayId, bookingId, value),
    onSuccess: (_data, vars) => {
      haptics.success();
      showToast(`Marked ${vars.value.toLowerCase()}`, 'success');
      client.invalidateQueries({ queryKey: staffKeys.shifts });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Could not mark attendance', 'danger');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ dayId, bookingId }: { dayId: string; bookingId: string }) =>
      cancelPracticalBooking(dayId, bookingId),
    onSuccess: () => {
      haptics.warning();
      showToast('Booking removed', 'neutral');
      client.invalidateQueries({ queryKey: staffKeys.shifts });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Could not remove booking', 'danger');
    },
  });

  function confirmRemove(row: BookingShift) {
    Alert.alert('Remove booking', `Remove ${row.studentName} from this shift?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => cancelMutation.mutate({ dayId: row.dayId, bookingId: row.bookingId }),
      },
    ]);
  }

  return (
    <StackScreen title={`Bookings · ${locationName}`} scroll={false}>
      <View style={styles.summary}>
        <Text variant="caption" color="textMuted">
          Date
        </Text>
        <Text variant="bodySmall">{formatPortalDate(date)}</Text>
        <View style={styles.summaryRow}>
          <Badge label={`${activeCount} active`} tone="success" />
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search student name or email"
          placeholderTextColor={tokens.colors.textMuted}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isLoading ? (
        <EntityListSkeleton rows={4} />
      ) : byShift.length === 0 ? (
        <EmptyState icon="people-outline" message="No active bookings for this location today." />
      ) : (
        <FlatList
          data={byShift}
          keyExtractor={(item) => `${item.shiftName}-${item.startTime}`}
          contentContainerStyle={styles.list}
          renderItem={({ item: shift }) => {
            const present = shift.rows.filter((row) =>
              /present/i.test(row.attendance ?? ''),
            ).length;
            const absent = shift.rows.filter((row) => /absent/i.test(row.attendance ?? '')).length;
            return (
              <View style={styles.shiftBlock}>
                <View style={styles.shiftHeader}>
                  <Text variant="bodySmall" style={styles.shiftTitle}>
                    {shift.shiftName}{' '}
                    <Text variant="caption" color="textMuted">
                      ({shift.startTime} – {shift.endTime})
                    </Text>
                  </Text>
                  <View style={styles.shiftBadges}>
                    <Badge label={`${shift.rows.length} Bookings`} tone="primary" />
                    <Badge label={`${present} Present`} tone="success" />
                    <Badge label={`${absent} Absent`} tone="danger" />
                  </View>
                </View>
                {shift.rows.map((row, index) => (
                  <View key={row.id} style={styles.row}>
                    <View style={styles.rowCopy}>
                      <Text variant="caption" color="textMuted">
                        #{index + 1}
                      </Text>
                      <Text variant="bodySmall" style={styles.name}>
                        {row.studentName}
                      </Text>
                      {row.studentEmail ? (
                        <Text variant="caption" color="textMuted">
                          {row.studentEmail}
                        </Text>
                      ) : null}
                      <Text variant="caption" color="textSecondary">
                        Seat {row.seat ?? '—'}
                        {row.bookedAt ? ` · booked ${row.bookedAt}` : ''}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      {canAttend && row.status === 'active' ? (
                        <View style={styles.attendRow}>
                          <ScalePressable
                            hapticStyle="select"
                            onPress={() =>
                              attendMutation.mutate({
                                dayId: row.dayId,
                                bookingId: row.bookingId,
                                value: 'Present',
                              })
                            }
                            style={[
                              styles.attendBtn,
                              styles.presentBtn,
                              /present/i.test(row.attendance ?? '') && styles.presentActive,
                            ]}
                          >
                            <Text
                              variant="caption"
                              color={
                                /present/i.test(row.attendance ?? '') ? 'onPrimary' : 'success'
                              }
                            >
                              Present
                            </Text>
                          </ScalePressable>
                          <ScalePressable
                            hapticStyle="select"
                            onPress={() =>
                              attendMutation.mutate({
                                dayId: row.dayId,
                                bookingId: row.bookingId,
                                value: 'Absent',
                              })
                            }
                            style={[
                              styles.attendBtn,
                              styles.absentBtn,
                              /absent/i.test(row.attendance ?? '') && styles.absentActive,
                            ]}
                          >
                            <Text
                              variant="caption"
                              color={/absent/i.test(row.attendance ?? '') ? 'onPrimary' : 'danger'}
                            >
                              Absent
                            </Text>
                          </ScalePressable>
                        </View>
                      ) : row.attendance ? (
                        <Badge
                          label={row.attendance}
                          tone={/absent/i.test(row.attendance) ? 'danger' : 'success'}
                        />
                      ) : null}
                      {canCancel && row.status === 'active' ? (
                        <Button
                          label="Remove"
                          variant="outline"
                          icon="trash-outline"
                          onPress={() => confirmRemove(row)}
                          style={styles.removeBtn}
                        />
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            );
          }}
        />
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  summary: {
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  search: {
    marginTop: tokens.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fontFamily.regular,
    fontSize: tokens.fontSize.sm,
  },
  list: {
    paddingBottom: tokens.spacing.xl,
    gap: tokens.spacing.lg,
  },
  shiftBlock: {
    gap: tokens.spacing.sm,
  },
  shiftHeader: {
    gap: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  shiftTitle: {
    fontFamily: tokens.fontFamily.medium,
  },
  shiftBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  row: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  rowCopy: {
    gap: 2,
  },
  name: {
    fontFamily: tokens.fontFamily.medium,
  },
  actions: {
    gap: tokens.spacing.sm,
  },
  attendRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  attendBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  presentBtn: {
    borderColor: tokens.colors.success,
  },
  presentActive: {
    backgroundColor: tokens.colors.success,
  },
  absentBtn: {
    borderColor: tokens.colors.danger,
  },
  absentActive: {
    backgroundColor: tokens.colors.danger,
  },
  removeBtn: {
    minHeight: 40,
  },
});
