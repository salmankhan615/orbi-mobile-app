import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { tokens } from '@/theme';

interface CardProps extends PropsWithChildren {
  style?: ViewStyle;
  padded?: boolean;
}

/** White elevated surface on the grouped canvas. */
export function Card({ children, style, padded = true }: CardProps) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
  padded: {
    padding: tokens.spacing.lg,
  },
});
