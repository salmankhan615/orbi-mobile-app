import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';

interface CourseAccessLockedProps {
  endLabel?: string;
  /** Compact pink banner (portal top alert). */
  variant?: 'banner' | 'panel';
}

export function CourseAccessLocked({ endLabel, variant = 'panel' }: CourseAccessLockedProps) {
  const ended = endLabel ? `ended on ${endLabel}` : 'has ended';

  if (variant === 'banner') {
    return (
      <View style={styles.banner}>
        <Ionicons name="lock-closed" size={18} color={tokens.colors.danger} />
        <View style={styles.bannerCopy}>
          <Text variant="bodySmall" color="danger" style={styles.bannerTitle}>
            Course Access Expired
          </Text>
          <Text variant="caption" color="textSecondary">
            Your allocation for this course {ended}. Course materials, videos, and documents are
            currently locked.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.lockCircle}>
        <Ionicons name="lock-closed" size={28} color={tokens.colors.danger} />
      </View>
      <Text variant="title" style={styles.panelTitle}>
        Course Material Locked
      </Text>
      <Text variant="bodySmall" color="textSecondary" style={styles.panelBody}>
        Your course allocation access {ended}. Playing videos, viewing documents, and opening images
        are disabled for expired access.
      </Text>
      <View style={styles.tip}>
        <Ionicons name="information-circle" size={16} color={tokens.colors.warning} />
        <Text variant="caption" color="textSecondary" style={styles.tipText}>
          Please contact administration to request a course extension.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
    marginHorizontal: tokens.spacing.screen,
    marginBottom: tokens.spacing.lg,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.dangerMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.danger,
  },
  bannerCopy: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  bannerTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  panel: {
    marginHorizontal: tokens.spacing.screen,
    marginTop: tokens.spacing.md,
    padding: tokens.spacing.xl,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    ...tokens.shadows.sm,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.dangerMuted,
    marginBottom: tokens.spacing.lg,
  },
  panelTitle: {
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  panelBody: {
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.warningMuted,
    width: '100%',
  },
  tipText: {
    flex: 1,
  },
});
