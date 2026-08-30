import { Alert, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { useBookableSlots, useBookSlot } from '@/queries/useBookings';
import { useAuthStore, displayName } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import type { BookingKind } from '@/api/bookings';

interface BookSlotListProps {
  kind: BookingKind;
  title: string;
}

export function BookSlotList({ kind, title }: BookSlotListProps) {
  const { data: slots } = useBookableSlots(kind);
  const book = useBookSlot();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);

  function handleBook(slotId: string, slotTitle: string) {
    if (!user) return;
    Alert.alert('Confirm booking', `Book ${slotTitle}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Book',
        onPress: () => {
          book.mutate(
            { slotId, student: { id: user.id, name: displayName(user) } },
            {
              onSuccess: () => showToast('Booking confirmed', 'success'),
              onError: () => showToast('Could not book this slot', 'danger'),
            },
          );
        },
      },
    ]);
  }

  return (
    <StackScreen title={title}>
      {(slots ?? []).map((slot) => (
        <View key={slot.id} style={styles.card}>
          <View style={styles.top}>
            <Text variant="bodySmall" style={styles.title}>
              {slot.title}
            </Text>
            <Badge label={slot.mode} tone="primary" />
          </View>
          <Text variant="caption" color="textSecondary">
            {slot.date} · {slot.startTime}–{slot.endTime}
          </Text>
          <Text variant="caption" color="textMuted">
            {slot.instructor} · {slot.seatsLeft} seats left
          </Text>
          <Button
            label="Book"
            variant="accent"
            onPress={() => handleBook(slot.id, slot.title)}
            disabled={slot.seatsLeft === 0 || book.isPending}
            style={styles.cta}
          />
        </View>
      ))}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: tokens.fontFamily.semibold,
  },
  cta: {
    marginTop: tokens.spacing.sm,
  },
});
