import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { FadeInView } from '@/components/custom/FadeInView';
import { staggerDelay } from '@/utils/formatters';
import type { Booking } from '@/api/bookings';
import type { BadgeTone } from '@/components/ui/Badge';

interface BookingPortalRowProps {
  booking: Booking;
  index: number;
}

export function BookingPortalRow({ booking, index }: BookingPortalRowProps) {
  const cancelled = booking.statusLabel.toLowerCase() === 'cancelled';
  const statusTone: BadgeTone = cancelled
    ? 'danger'
    : booking.statusLabel.toLowerCase() === 'active'
      ? 'success'
      : 'neutral';
  const isTraining = booking.kind === 'training';

  return (
    <FadeInView delay={staggerDelay(index)}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconChip}>
            <Ionicons
              name={isTraining ? 'people-outline' : 'school-outline'}
              size={18}
              color={tokens.colors.secondary}
            />
          </View>
          <View style={styles.headerCopy}>
            <Text variant="overline" color="textMuted">
              {booking.typeLabel}
            </Text>
            <Text variant="bodySmall" style={styles.title} numberOfLines={2}>
              {booking.title}
            </Text>
          </View>
          <Badge label={booking.statusLabel} tone={statusTone} />
        </View>

        <View style={styles.grid}>
          <Field icon="location-outline" label="Location" value={booking.locationLabel} />
          <Field icon="calendar-outline" label="Date" value={booking.dateLabel} />
          <Field
            icon="time-outline"
            label="Time"
            value={booking.startTime !== '—' ? `${booking.startTime}–${booking.endTime}` : '—'}
          />
          <Field
            icon="grid-outline"
            label="Seat"
            value={booking.seat != null ? String(booking.seat) : '—'}
          />
          <Field
            icon="checkbox-outline"
            label="Attendance"
            value={booking.attendanceLabel ?? '—'}
          />
          <Field icon="create-outline" label="Booked" value={booking.bookingDateLabel} />
        </View>
      </View>
    </FadeInView>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon} size={12} color={tokens.colors.textMuted} />
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      </View>
      <Text variant="bodySmall" style={styles.fieldValue} numberOfLines={2}>
        {value}
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
  header: {
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
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  field: {
    width: '47%',
    gap: 2,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  fieldValue: {
    fontFamily: tokens.fontFamily.medium,
  },
});
