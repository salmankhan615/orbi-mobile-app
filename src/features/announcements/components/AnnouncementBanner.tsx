import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';
import type { Announcement } from '@/api/announcements';

interface AnnouncementBannerProps {
  announcement: Announcement;
  onPress?: () => void;
}

export function AnnouncementBanner({ announcement, onPress }: AnnouncementBannerProps) {
  return (
    <ScalePressable onPress={onPress} style={styles.banner}>
      <View style={styles.icon}>
        <Ionicons name="megaphone" size={18} color={tokens.colors.onTertiary} />
      </View>
      <View style={styles.body}>
        <Text variant="caption" color="secondary" style={styles.kicker}>
          Announcement
        </Text>
        <Text variant="bodySmall" style={styles.title} numberOfLines={1}>
          {announcement.title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={2}>
          {announcement.body}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.tertiaryMuted,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontFamily: tokens.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
