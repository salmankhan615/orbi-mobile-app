import { Image, StyleSheet } from 'react-native';

export interface LogoProps {
  /**
   * 'mark' — square Orbi icon (navy glyph on white).
   * 'full' — Orbi wordmark lockup (wide).
   */
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
}

const MARK_LOGO = require('@/assets/images/logo-mark.png');
const FULL_LOGO = require('@/assets/images/logo.png');

const MARK_HEIGHTS = { sm: 40, md: 64, lg: 96 } as const;
/** Wordmark is 1024×500 — keep that aspect ratio. */
const FULL_HEIGHTS = { sm: 28, md: 40, lg: 56 } as const;
const FULL_ASPECT = 1024 / 500;

export function Logo({ variant = 'full', size = 'md' }: LogoProps) {
  if (variant === 'mark') {
    const height = MARK_HEIGHTS[size];
    return (
      <Image
        source={MARK_LOGO}
        style={[styles.image, { width: height, height }]}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Orbi"
      />
    );
  }

  const height = FULL_HEIGHTS[size];
  const width = Math.round(height * FULL_ASPECT);
  return (
    <Image
      source={FULL_LOGO}
      style={[styles.image, { width, height }]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Orbi"
    />
  );
}

const styles = StyleSheet.create({
  image: {},
});
