import { Alert, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { useBooking, useCancelBooking, useMarkAttendance } from '@/queries/useBookings';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'StaffBookingDetail'>;

export function StaffBookingDetailScreen({ route, navigation }: Props) {
  const { data } = useBooking(route.params.bookingId);
  const canAttend = useHasPermission('mark_attendance');
  const canCancel = useHasPermission('cancel_booking');
  const mark = useMarkAttendance();
  const cancel = useCancelBooking();
  const showToast = useToastStore((state) => state.show);

  if (!data) {
    return (
      <StackScreen title="Booking">
        <Text variant="body" color="textMuted">
          Loading…
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Booking">
      <Text variant="heading">{data.title}</Text>
      <Text variant="bodySmall" color="textSecondary" style={styles.meta}>
        {data.studentName}
      </Text>
      <Text variant="bodySmall" color="textMuted">
        {data.date} · {data.startTime}–{data.endTime}
      </Text>
      <View style={styles.badge}>
        <Badge label={data.status} tone={data.status === 'cancelled' ? 'danger' : 'success'} />
      </View>

      {canAttend && data.status !== 'cancelled' ? (
        <View style={styles.actions}>
          <Button
            label="Present"
            variant="accent"
            onPress={() =>
              mark.mutate(
                { id: data.id, attendance: 'present' },
                { onSuccess: () => showToast('Marked present', 'success') },
              )
            }
          />
          <Button
            label="Late"
            variant="secondary"
            onPress={() =>
              mark.mutate(
                { id: data.id, attendance: 'late' },
                { onSuccess: () => showToast('Marked late', 'success') },
              )
            }
          />
          <Button
            label="Absent"
            variant="outline"
            onPress={() =>
              mark.mutate(
                { id: data.id, attendance: 'absent' },
                { onSuccess: () => showToast('Marked absent', 'neutral') },
              )
            }
          />
        </View>
      ) : null}

      {canCancel && data.status === 'confirmed' ? (
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
  badge: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  actions: {
    gap: tokens.spacing.sm,
  },
  cancel: {
    marginTop: tokens.spacing.lg,
  },
});
