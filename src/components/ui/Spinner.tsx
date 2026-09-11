import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { tokens } from '@/theme';
import { Text } from './Text';

interface SpinnerProps {
  label?: string;
  size?: 'small' | 'large';
  /** Stretch and center — use for full-screen / remaining-space waits. */
  fill?: boolean;
  color?: keyof typeof tokens.colors;
  style?: StyleProp<ViewStyle>;
}

export function Spinner({
  label,
  size = 'small',
  fill = false,
  color = 'primary',
  style,
}: SpinnerProps) {
  return (
    <View style={[fill ? styles.fill : styles.inline, style]}>
      <ActivityIndicator size={size} color={tokens.colors[color]} />
      {label ? (
        <Text variant="bodySmall" color="textMuted" style={styles.label}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.md,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xxl,
  },
  label: {
    textAlign: 'center',
  },
});
