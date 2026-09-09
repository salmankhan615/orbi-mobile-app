import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type { Booking } from '@/api/bookings';

interface BookingPortalRowProps {
  booking: Booking;
  index: number;
}

export function BookingPortalRow({ booking, index }: BookingPortalRowProps) {
  const statusColor =
    booking.statusLabel.toLowerCase() === 'cancelled'
      ? 'danger'
      : booking.statusLabel.toLowerCase() === 'active'
        ? 'success'
        : 'textSecondary';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant="caption" color="textMuted">
          #{index + 1}
        </Text>
        <Text variant="caption" color="textSecondary" style={styles.type}>
          {booking.typeLabel}
        </Text>
        <Text variant="bodySmall" color={statusColor} style={styles.status}>
          {booking.statusLabel}
        </Text>
      </View>

      <Text variant="bodySmall" style={styles.title}>
        {booking.title}
      </Text>

      <View style={styles.grid}>
        <Field label="Location" value={booking.locationLabel} />
        <Field label="Date" value={booking.dateLabel} />
        <Field label="Booking Date" value={booking.bookingDateLabel} />
        <Field label="Seat" value={booking.seat != null ? String(booking.seat) : '—'} />
        <Field label="Attendance" value={booking.attendanceLabel ?? '—'} />
        <Field
          label="Time"
          value={booking.startTime !== '—' ? `${booking.startTime}–${booking.endTime}` : '—'}
        />
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="bodySmall" style={styles.fieldValue}>
        {value}
      </Text>
    </View>
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
    gap: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  type: {
    flex: 1,
    fontFamily: tokens.fontFamily.medium,
  },
  status: {
    fontFamily: tokens.fontFamily.semibold,
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
  fieldValue: {
    fontFamily: tokens.fontFamily.medium,
  },
});
