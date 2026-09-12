import { Alert, StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import { cancelPracticalBooking, markPracticalAttendance } from '@/api/crm';
import { staffKeys } from '@/queries/useStaff';
import { bookingKeys } from '@/queries/useBookings';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'BookingShiftDetail'>;

export function BookingShiftDetailScreen({ route, navigation }: Props) {
  const {
    dayId,
    bookingId,
    studentName,
    studentEmail,
    studentId,
    shiftName,
    date,
    startTime,
    endTime,
    location,
    seat,
    status,
    statusLabel,
    attendance,
    bookedAt,
    bookedByName,
    cancelledAt,
    isOverridden,
  } = route.params;

  const canAttend = useHasPermission('mark_attendance');
  const canCancel = useHasPermission('cancel_booking');
  const showToast = useToastStore((state) => state.show);
  const client = useQueryClient();
  const marked = Boolean(attendance);
  const isCancelled = status === 'cancelled';

  const attendMutation = useMutation({
    mutationFn: (value: 'Present' | 'Absent') =>
      markPracticalAttendance(dayId, bookingId, value),
    onSuccess: (_data, value) => {
      showToast(value === 'Present' ? 'Marked present' : 'Marked absent', 'success');
      client.invalidateQueries({ queryKey: staffKeys.shifts });
      client.invalidateQueries({ queryKey: bookingKeys.staff });
      navigation.setParams({ attendance: value });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Could not mark attendance', 'danger');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPracticalBooking(dayId, bookingId),
    onSuccess: () => {
      showToast('Booking cancelled', 'neutral');
      client.invalidateQueries({ queryKey: staffKeys.shifts });
      client.invalidateQueries({ queryKey: bookingKeys.staff });
      navigation.goBack();
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Could not cancel booking', 'danger');
    },
  });

  return (
    <StackScreen title="Shift booking">
      <Text variant="heading">{shiftName}</Text>
      <Text variant="bodySmall" color="textSecondary" style={styles.meta}>
        {studentName}
        {seat != null ? ` · Seat ${seat}` : ''}
      </Text>
      <View style={styles.badges}>
        <Badge
          label={statusLabel || status}
          tone={isCancelled ? 'danger' : 'success'}
        />
        {attendance ? (
          <Badge
            label={attendance}
            tone={/absent/i.test(attendance) ? 'danger' : 'success'}
          />
        ) : null}
        {isOverridden ? <Badge label="Override" tone="warning" /> : null}
      </View>

      <EntityRow
        icon="calendar-outline"
        title="When"
        subtitle={`${date} · ${startTime}–${endTime}`}
      />
      <EntityRow icon="location-outline" title="Location" subtitle={location} />
      {studentEmail ? (
        <EntityRow icon="mail-outline" title="Student email" subtitle={studentEmail} />
      ) : null}
      {bookedAt ? (
        <EntityRow
          icon="time-outline"
          title="Booked"
          subtitle={bookedByName ? `${bookedAt} · by ${bookedByName}` : bookedAt}
        />
      ) : null}
      {cancelledAt ? (
        <EntityRow icon="close-circle-outline" title="Cancelled" subtitle={cancelledAt} />
      ) : null}

      {studentId ? (
        <Button
          label="View student"
          variant="outline"
          onPress={() =>
            navigation.navigate('UserDetail', {
              userId: studentId,
              name: studentName,
              email: studentEmail ?? '',
              role: 'student',
            })
          }
          style={styles.studentBtn}
        />
      ) : null}

      {canAttend && !isCancelled && !marked ? (
        <View style={styles.actions}>
          <Button
            label="Present"
            variant="accent"
            loading={attendMutation.isPending}
            onPress={() => attendMutation.mutate('Present')}
          />
          <Button
            label="Absent"
            variant="outline"
            loading={attendMutation.isPending}
            onPress={() => attendMutation.mutate('Absent')}
          />
        </View>
      ) : null}

      {marked && !isCancelled ? (
        <Text variant="bodySmall" color="textMuted" style={styles.note}>
          Attendance recorded as {attendance}.
        </Text>
      ) : null}

      {canCancel && !isCancelled && !marked ? (
        <Button
          label="Cancel booking"
          variant="outline"
          loading={cancelMutation.isPending}
          onPress={() =>
            Alert.alert('Cancel booking', 'This will free the seat on this shift.', [
              { text: 'Keep', style: 'cancel' },
              {
                text: 'Cancel booking',
                style: 'destructive',
                onPress: () => cancelMutation.mutate(),
              },
            ])
          }
          style={styles.cancel}
        />
      ) : null}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  meta: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  studentBtn: {
    marginTop: tokens.spacing.md,
  },
  actions: {
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xl,
  },
  note: {
    marginTop: tokens.spacing.md,
  },
  cancel: {
    marginTop: tokens.spacing.lg,
  },
});
