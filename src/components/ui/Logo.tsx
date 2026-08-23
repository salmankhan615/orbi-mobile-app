import { Image, StyleSheet } from 'react-native';

export interface LogoProps {
  /**
   * 'full' — KBM mark + "Training & Recruitment" wordmark (black text: needs
   *   a light background — auth screens, light headers).
   * 'mark' — just the KBM lettermark + red graphic (no black text: safe on
   *   dark backgrounds — app header, splash, compact spaces).
   */
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
}

const FULL_LOGO = require('@/assets/images/logo.png');
const MARK_LOGO = require('@/assets/images/logo-mark.png');

// Full lockup is ~4.5:1, the mark alone is ~1.1:1.
const HEIGHTS = { sm: 28, md: 40, lg: 56 } as const;
const ASPECT_RATIO = { full: 1200 / 268, mark: 384 / 351 } as const;

export function Logo({ variant = 'full', size = 'md' }: LogoProps) {
  const height = HEIGHTS[size];
  const width = height * ASPECT_RATIO[variant];

  return (
    <Image
      source={variant === 'full' ? FULL_LOGO : MARK_LOGO}
      style={[styles.image, { width, height }]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="KBM Training & Recruitment"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    // Dimensions are set per-instance from `size`/`variant` above.
  },
});
