import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { cancelClassBooking, markClassAttendance } from '@/api/crm';
import { bookingKeys, useClassRoster } from '@/queries/useBookings';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { formatPortalDate } from '@/utils/date';
import { haptics } from '@/utils/haptics';
import type { Booking } from '@/api/bookings';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'ClassBookings'>;

export function ClassBookingsScreen({ route, navigation }: Props) {
  const { classId, title, date, dateLabel, startTime, endTime, location } = route.params;
  const canAttend = useHasPermission('mark_attendance');
  const canCancel = useHasPermission('cancel_booking');
  const showToast = useToastStore((state) => state.show);
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useClassRoster(classId);

  const bookings = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((row) => row.studentName.toLowerCase().includes(q));
  }, [bookings, search]);

  const activeCount = bookings.filter((row) => row.status !== 'cancelled').length;

  const attendMutation = useMutation({
    mutationFn: ({
      studentId,
      value,
    }: {
      studentId: string;
      value: 'Present' | 'Absent';
    }) => markClassAttendance(classId, { user: studentId, attendance: value }),
    onSuccess: (_data, vars) => {
      haptics.success();
      showToast(`Marked ${vars.value.toLowerCase()}`, 'success');
      client.invalidateQueries({ queryKey: bookingKeys.classRoster(classId) });
      client.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Could not mark attendance', 'danger');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (studentId: string) => cancelClassBooking(classId, studentId),
    onSuccess: () => {
      haptics.warning();
      showToast('Booking removed', 'neutral');
      client.invalidateQueries({ queryKey: bookingKeys.classRoster(classId) });
      client.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Could not remove booking', 'danger');
    },
  });

  function confirmRemove(row: Booking) {
    Alert.alert('Remove booking', `Remove ${row.studentName} from this class?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => cancelMutation.mutate(row.studentId),
      },
    ]);
  }

  return (
    <StackScreen title={title || 'Class bookings'} scroll={false}>
      <View style={styles.summary}>
        <Text variant="caption" color="textMuted">
          Date
        </Text>
        <Text variant="bodySmall">{dateLabel || formatPortalDate(date)}</Text>
        <Text variant="caption" color="textMuted">
          {startTime}–{endTime}
          {location ? ` · ${location}` : ''}
        </Text>
        <View style={styles.summaryRow}>
          <Badge label={`${activeCount} active`} tone="success" />
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search student name"
          placeholderTextColor={tokens.colors.textMuted}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isLoading ? (
        <EntityListSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="people-outline" message="No bookings for this class." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: row, index }) => {
            const marked = Boolean(row.attendance);
            return (
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text variant="caption" color="textMuted">
                    #{index + 1}
                  </Text>
                  <Text variant="bodySmall" style={styles.name}>
                    {row.studentName}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    Seat {row.seat ?? '—'}
                    {row.statusLabel ? ` · ${row.statusLabel}` : ''}
                  </Text>
                </View>
                <View style={styles.actions}>
                  {canAttend && row.status !== 'cancelled' ? (
                    <View style={styles.attendRow}>
                      <ScalePressable
                        hapticStyle="select"
                        onPress={() =>
                          attendMutation.mutate({
                            studentId: row.studentId,
                            value: 'Present',
                          })
                        }
                        style={[
                          styles.attendBtn,
                          styles.presentBtn,
                          row.attendance === 'present' && styles.presentActive,
                        ]}
                      >
                        <Text
                          variant="caption"
                          color={row.attendance === 'present' ? 'onPrimary' : 'success'}
                        >
                          Present
                        </Text>
                      </ScalePressable>
                      <ScalePressable
                        hapticStyle="select"
                        onPress={() =>
                          attendMutation.mutate({
                            studentId: row.studentId,
                            value: 'Absent',
                          })
                        }
                        style={[
                          styles.attendBtn,
                          styles.absentBtn,
                          row.attendance === 'absent' && styles.absentActive,
                        ]}
                      >
                        <Text
                          variant="caption"
                          color={row.attendance === 'absent' ? 'onPrimary' : 'danger'}
                        >
                          Absent
                        </Text>
                      </ScalePressable>
                    </View>
                  ) : marked ? (
                    <Badge
                      label={row.attendanceLabel || row.attendance || 'Marked'}
                      tone={row.attendance === 'absent' ? 'danger' : 'success'}
                    />
                  ) : null}
                  {canCancel && row.status === 'confirmed' ? (
                    <Button
                      label="Remove"
                      variant="outline"
                      icon="trash-outline"
                      onPress={() => confirmRemove(row)}
                      style={styles.removeBtn}
                    />
                  ) : null}
                  <Button
                    label="Details"
                    variant="outline"
                    onPress={() => {
                      client.setQueryData(bookingKeys.detail(row.id), row);
                      navigation.navigate('StaffBookingDetail', { bookingId: row.id });
                    }}
                    style={styles.removeBtn}
                  />
                </View>
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
    gap: tokens.spacing.md,
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
