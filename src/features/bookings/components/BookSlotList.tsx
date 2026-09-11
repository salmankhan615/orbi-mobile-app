import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { HeroBanner } from '@/components/custom/HeroBanner';
import { FadeInView } from '@/components/custom/FadeInView';
import { useBookableSlots, useBookSlot } from '@/queries/useBookings';
import { CardListSkeleton } from '@/components/custom/Skeletons';
import { useAuthStore, displayName } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { staggerDelay } from '@/utils/formatters';
import { haptics } from '@/utils/haptics';
import type { BookingKind } from '@/api/bookings';

interface BookSlotListProps {
  kind: BookingKind;
  title: string;
}

export function BookSlotList({ kind, title }: BookSlotListProps) {
  const { data: slots, isLoading } = useBookableSlots(kind);
  const book = useBookSlot();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const isClass = kind === 'class';

  function handleBook(slotId: string, slotTitle: string, seat?: number) {
    if (!user) return;
    Alert.alert('Confirm booking', `Book ${slotTitle}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Book',
        onPress: () => {
          book.mutate(
            { slotId, student: { id: user.id, name: displayName(user) }, seat },
            {
              onSuccess: () => {
                haptics.success();
                showToast('Booking confirmed', 'success');
              },
              onError: () => showToast('Could not book this slot', 'danger'),
            },
          );
        },
      },
    ]);
  }

  return (
    <StackScreen title={title}>
      <HeroBanner
        kicker={isClass ? 'Classroom' : 'Practical'}
        title={isClass ? 'Available classes' : 'Available training'}
        subtitle="Choose a slot with seats remaining, then confirm."
        icon={isClass ? 'school-outline' : 'people-outline'}
      />

      {isLoading ? (
        <CardListSkeleton rows={3} />
      ) : (slots ?? []).length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Nothing open right now"
          message="No bookable slots are available. Check back later or pick another day."
        />
      ) : (
        (slots ?? []).map((slot, index) => (
          <FadeInView key={slot.id} delay={staggerDelay(index)}>
            <View style={styles.card}>
              <View style={styles.top}>
                <View style={styles.iconChip}>
                  <Ionicons
                    name={isClass ? 'book-outline' : 'people-outline'}
                    size={18}
                    color={tokens.colors.secondary}
                  />
                </View>
                <View style={styles.copy}>
                  <Text variant="bodySmall" style={styles.title} numberOfLines={2}>
                    {slot.title}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {slot.instructor}
                  </Text>
                </View>
                <Badge label={slot.mode} tone={slot.mode === 'Online' ? 'info' : 'primary'} />
              </View>

              <View style={styles.metaRow}>
                <Meta icon="calendar-outline" label={slot.date} />
                <Meta icon="time-outline" label={`${slot.startTime}–${slot.endTime}`} />
              </View>

              <View style={styles.footer}>
                <View
                  style={[
                    styles.seatsPill,
                    slot.seatsLeft === 0 && styles.seatsPillEmpty,
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={
                      slot.seatsLeft === 0 ? tokens.colors.danger : tokens.colors.tertiary
                    }
                  />
                  <Text
                    variant="caption"
                    color={slot.seatsLeft === 0 ? 'danger' : 'textPrimary'}
                    style={styles.seatsLabel}
                  >
                    {slot.seatsLeft === 0 ? 'Full' : `${slot.seatsLeft} seats left`}
                  </Text>
                </View>
                <Button
                  label="Book"
                  variant="accent"
                  onPress={() => handleBook(slot.id, slot.title, slot.seat)}
                  disabled={slot.seatsLeft === 0 || book.isPending}
                  loading={book.isPending}
                  style={styles.cta}
                />
              </View>
            </View>
          </FadeInView>
        ))
      )}
    </StackScreen>
  );
}

function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={14} color={tokens.colors.textMuted} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  seatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    backgroundColor: tokens.colors.tertiaryMuted,
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  seatsPillEmpty: {
    backgroundColor: tokens.colors.dangerMuted,
  },
  seatsLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  cta: {
    minWidth: 108,
  },
});
