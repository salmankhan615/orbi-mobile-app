import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type { BookingStats } from '@/features/bookings/bookingFilters';

interface BookingStatsBarProps {
  stats: BookingStats;
}

export function BookingStatsBar({ stats }: BookingStatsBarProps) {
  return (
    <View style={styles.bar}>
      <StatCell label="Total" value={String(stats.total)} tone="default" />
      <StatCell label="Booked" value={String(stats.booked)} tone="success" />
      <StatCell label="Cancelled" value={String(stats.cancelled)} tone="danger" />
    </View>
  );
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'default' | 'success' | 'danger';
}) {
  const valueColor = tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : 'textPrimary';

  return (
    <View style={styles.cell}>
      <Text variant="caption" color="textMuted" style={styles.label}>
        {label}
      </Text>
      <Text variant="title" color={valueColor} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  cell: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.xxs,
    ...tokens.shadows.sm,
  },
  label: {
    fontFamily: tokens.fontFamily.medium,
  },
  value: {
    fontFamily: tokens.fontFamily.bold,
  },
});
