import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { tokens } from '@/theme';
import { Text } from './Text';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

const TONE_COLORS: Record<
  BadgeTone,
  { bg: keyof typeof tokens.colors; fg: keyof typeof tokens.colors }
> = {
  success: { bg: 'successMuted', fg: 'success' },
  warning: { bg: 'warningMuted', fg: 'warning' },
  danger: { bg: 'dangerMuted', fg: 'danger' },
  neutral: { bg: 'surfaceAlt', fg: 'textSecondary' },
  primary: { bg: 'primaryMuted', fg: 'primary' },
  info: { bg: 'infoMuted', fg: 'info' },
};

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const { bg, fg } = TONE_COLORS[tone];

  return (
    <View style={[styles.badge, { backgroundColor: tokens.colors[bg] }, style]}>
      <Text variant="caption" color={fg} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: tokens.fontFamily.medium,
    fontSize: tokens.fontSize.xs,
  },
});
