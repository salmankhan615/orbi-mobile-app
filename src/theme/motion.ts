import { Easing } from 'react-native-reanimated';

export const duration = {
  instant: 100,
  fast: 160,
  base: 240,
  slow: 360,
} as const;

export const easing = {
  standard: Easing.bezier(0.25, 0.1, 0.25, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0, 1, 1),
} as const;

export type DurationToken = keyof typeof duration;
