import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { formatRelativeTime } from '@/utils/formatters';
import type { AppNotification, NotificationType } from '@/api/notifications';
import type { BadgeTone } from '@/components/ui/Badge';

export const NOTIFICATION_META: Record<
  NotificationType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    tone: BadgeTone;
    label: string;
    chipBg: keyof typeof tokens.colors;
    chipFg: keyof typeof tokens.colors;
  }
> = {
  announcement: {
    icon: 'megaphone-outline',
    tone: 'warning',
    label: 'Announcement',
    chipBg: 'tertiaryMuted',
    chipFg: 'tertiary',
  },
  upcoming_class: {
    icon: 'calendar-outline',
    tone: 'info',
    label: 'Class',
    chipBg: 'secondaryMuted',
    chipFg: 'secondary',
  },
  upcoming_training: {
    icon: 'fitness-outline',
    tone: 'warning',
    label: 'Training',
    chipBg: 'tertiaryMuted',
    chipFg: 'tertiary',
  },
  course_progress: {
    icon: 'trending-up-outline',
    tone: 'warning',
    label: 'Progress',
    chipBg: 'successMuted',
    chipFg: 'success',
  },
};

interface NotificationCardProps {
  item: AppNotification;
  onPress: () => void;
}

export function NotificationCard({ item, onPress }: NotificationCardProps) {
  const meta = NOTIFICATION_META[item.type];
  const unread = !item.read;

  return (
    <ScalePressable onPress={onPress} style={[styles.card, unread && styles.cardUnread]}>
      {unread ? <View style={styles.unreadBar} /> : null}
      <View style={[styles.iconChip, { backgroundColor: tokens.colors[meta.chipBg] }]}>
        <Ionicons name={meta.icon} size={18} color={tokens.colors[meta.chipFg]} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text variant="overline" color={unread ? 'tertiary' : 'textMuted'}>
            {unread ? 'New' : meta.label}
          </Text>
          <Text variant="caption" color="textMuted">
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
  cardUnread: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.tertiary,
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: tokens.colors.tertiary,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
