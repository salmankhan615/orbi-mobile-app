import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { tokens } from '@/theme';

type Variant = 'largeTitle' | 'heading' | 'title' | 'body' | 'bodySmall' | 'caption' | 'overline';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: keyof typeof tokens.colors;
}

// Weight rule: page titles = semibold, never black/extrabold.
// Body stays regular; captions use medium for legibility at small size.
const variantStyles = StyleSheet.create({
  largeTitle: {
    fontSize: tokens.fontSize.xxxl,
    lineHeight: tokens.lineHeight.xxxl,
    fontFamily: tokens.fontFamily.semibold,
    letterSpacing: -0.2,
  },
  heading: {
    fontSize: tokens.fontSize.xxl,
    lineHeight: tokens.lineHeight.xxl,
    fontFamily: tokens.fontFamily.semibold,
    letterSpacing: -0.15,
  },
  title: {
    fontSize: tokens.fontSize.xl,
    lineHeight: tokens.lineHeight.xl,
    fontFamily: tokens.fontFamily.semibold,
  },
  body: {
    fontSize: tokens.fontSize.lg,
    lineHeight: tokens.lineHeight.lg,
    fontFamily: tokens.fontFamily.regular,
  },
  bodySmall: {
    fontSize: tokens.fontSize.md,
    lineHeight: tokens.lineHeight.md,
    fontFamily: tokens.fontFamily.regular,
  },
  caption: {
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.lineHeight.sm,
    fontFamily: tokens.fontFamily.medium,
  },
  overline: {
    fontSize: tokens.fontSize.xs,
    lineHeight: tokens.lineHeight.xs,
    fontFamily: tokens.fontFamily.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export function Text({ variant = 'body', color = 'textPrimary', style, ...rest }: TextProps) {
  return (
    <RNText style={[variantStyles[variant], { color: tokens.colors[color] }, style]} {...rest} />
  );
}
