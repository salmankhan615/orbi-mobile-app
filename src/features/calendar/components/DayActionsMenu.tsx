import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { formatClosureDetails, type CalendarClosure } from '@/api/staff';

interface DayActionsMenuProps {
  closure?: CalendarClosure | null;
  calendarLabel?: string;
  onCloseDay?: () => void;
}

export function DayActionsMenu({ closure, calendarLabel, onCloseDay }: DayActionsMenuProps) {
  if (closure) {
    const scope = closure.scope === 'global' ? 'All calendars' : calendarLabel || 'Calendar';
    const detail = [formatClosureDetails(closure), scope, closure.reason].filter(Boolean).join(' · ');
    return (
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Ionicons name="lock-closed" size={16} color={tokens.colors.danger} />
        </View>
        <View style={styles.bannerCopy}>
          <Text variant="bodySmall" style={styles.bannerTitle}>
            This day is closed
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {detail}
          </Text>
        </View>
      </View>
    );
  }

  if (!onCloseDay) return null;

  return (
    <View style={styles.menu}>
      <ScalePressable onPress={onCloseDay} style={styles.row}>
        <Ionicons name="calendar-outline" size={18} color={tokens.colors.danger} />
        <Text variant="bodySmall" color="danger" style={styles.label}>
          Close this day
        </Text>
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
  },
  label: {
    fontFamily: tokens.fontFamily.semibold,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.dangerMuted,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.danger,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  bannerTitle: {
    fontFamily: tokens.fontFamily.semibold,
    color: tokens.colors.danger,
  },
});
