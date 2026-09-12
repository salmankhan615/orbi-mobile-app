import { Alert, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { Spinner } from '@/components/ui/Spinner';
import { useBooking, useCancelBooking, useMarkAttendance } from '@/queries/useBookings';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'StaffBookingDetail'>;

export function StaffBookingDetailScreen({ route, navigation }: Props) {
  const canView = useHasPermission('view_bookings');
  const { data, isLoading } = useBooking(route.params.bookingId);
  const canAttend = useHasPermission('mark_attendance');
  const canCancel = useHasPermission('cancel_booking');
  const mark = useMarkAttendance();
  const cancel = useCancelBooking();
  const showToast = useToastStore((state) => state.show);

  if (!canView) {
    return (
      <StackScreen title="Booking">
        <Text variant="body" color="textMuted">
          You do not have permission to view bookings.
        </Text>
      </StackScreen>
    );
  }

  if (isLoading || !data) {
    return (
      <StackScreen title="Booking">
        <Spinner fill label="Loading booking…" />
      </StackScreen>
    );
  }

  const marked = Boolean(data.attendance);
  const showAttendanceActions = canAttend && data.status !== 'cancelled' && !marked;
  const showCancel = canCancel && data.status === 'confirmed' && !marked;

  return (
    <StackScreen title="Booking">
      <Text variant="heading">{data.title}</Text>
      <Text variant="bodySmall" color="textSecondary" style={styles.meta}>
        {data.studentName || 'Student'}
        {data.seat != null ? ` · Seat ${data.seat}` : ''}
      </Text>
      <Text variant="bodySmall" color="textMuted">
        {data.date} · {data.startTime}–{data.endTime}
      </Text>
      <View style={styles.badges}>
        <Badge
          label={data.statusLabel || data.status}
          tone={data.status === 'cancelled' ? 'danger' : 'success'}
        />
        {marked ? (
          <Badge
            label={data.attendanceLabel || data.attendance || 'Marked'}
            tone={data.attendance === 'absent' ? 'danger' : 'success'}
          />
        ) : null}
      </View>

      {showAttendanceActions ? (
        <View style={styles.actions}>
          <Button
            label="Present"
            variant="accent"
            loading={mark.isPending}
            onPress={() =>
              mark.mutate(
                { id: data.id, attendance: 'present' },
                { onSuccess: () => showToast('Marked present', 'success') },
              )
            }
          />
          <Button
            label="Absent"
            variant="outline"
            loading={mark.isPending}
            onPress={() =>
              mark.mutate(
                { id: data.id, attendance: 'absent' },
                { onSuccess: () => showToast('Marked absent', 'neutral') },
              )
            }
          />
        </View>
      ) : null}

      {marked && data.status !== 'cancelled' ? (
        <Text variant="bodySmall" color="textMuted" style={styles.markedNote}>
          Attendance recorded as {data.attendanceLabel || data.attendance}.
        </Text>
      ) : null}

      {showCancel ? (
        <Button
          label="Cancel booking"
          variant="outline"
          onPress={() =>
            Alert.alert('Cancel booking', 'This will free the seat.', [
              { text: 'Keep', style: 'cancel' },
              {
                text: 'Cancel booking',
                style: 'destructive',
                onPress: () =>
                  cancel.mutate(data.id, {
                    onSuccess: () => {
                      showToast('Booking cancelled', 'neutral');
                      navigation.goBack();
                    },
                  }),
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
    marginBottom: tokens.spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  actions: {
    gap: tokens.spacing.sm,
  },
  markedNote: {
    marginTop: tokens.spacing.md,
  },
  cancel: {
    marginTop: tokens.spacing.lg,
  },
});
