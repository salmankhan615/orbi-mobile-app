import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type { BookingStats } from '@/features/bookings/bookingFilters';

interface BookingStatsBarProps {
  stats: BookingStats;
}

export function BookingStatsBar({ stats }: BookingStatsBarProps) {
  return (
    <View style={styles.bar}>
      <StatCell icon="layers-outline" label="Total" value={String(stats.total)} tone="default" />
      <StatCell icon="checkmark-circle-outline" label="Booked" value={String(stats.booked)} tone="success" />
      <StatCell icon="close-circle-outline" label="Cancelled" value={String(stats.cancelled)} tone="danger" />
    </View>
  );
}

function StatCell({
  icon,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: 'default' | 'success' | 'danger';
}) {
  const valueColor = tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : 'textPrimary';
  const iconColor =
    tone === 'success'
      ? tokens.colors.success
      : tone === 'danger'
        ? tokens.colors.danger
        : tokens.colors.secondary;
  const chipBg =
    tone === 'success'
      ? tokens.colors.successMuted
      : tone === 'danger'
        ? tokens.colors.dangerMuted
        : tokens.colors.secondaryMuted;

  return (
    <View style={styles.cell}>
      <View style={[styles.iconChip, { backgroundColor: chipBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
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
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    fontFamily: tokens.fontFamily.medium,
  },
  value: {
    fontFamily: tokens.fontFamily.bold,
  },
});
