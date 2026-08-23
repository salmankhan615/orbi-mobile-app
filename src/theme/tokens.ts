import { colors } from './colors';
import { fontFamily, fontSize, fontWeight, lineHeight } from './typography';
import { spacing, radius } from './spacing';
import { shadows } from './shadows';
import { duration, easing } from './motion';
import { gradients } from './gradients';

// Single import surface for every design decision in the app.
// Components must read values from here (or from theme/index) instead of
// hardcoding colors, spacing, radii, font families, or shadows.
// This is enforced by the `local/no-raw-design-values` ESLint rule.
export const tokens = {
  colors,
  spacing,
  radius,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  shadows,
  duration,
  easing,
  gradients,
} as const;

export type Tokens = typeof tokens;
