import { Image, StyleSheet } from 'react-native';

export interface LogoProps {
  /**
   * 'full' / 'mark' — both use the square KBM app mark (navy KBM + red graphic).
   * Kept as separate variants so existing call sites keep working.
   */
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
}

const MARK_LOGO = require('@/assets/images/logo-mark.png');

const HEIGHTS = { sm: 40, md: 64, lg: 96 } as const;

export function Logo({ variant: _variant = 'full', size = 'md' }: LogoProps) {
  const height = HEIGHTS[size];
  const width = height; // square mark

  return (
    <Image
      source={MARK_LOGO}
      style={[styles.image, { width, height }]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="KBM Training & Recruitment"
    />
  );
}

const styles = StyleSheet.create({
  image: {},
});
