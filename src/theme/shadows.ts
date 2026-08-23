import { Platform } from 'react-native';
import { palette } from './colors';

const shadow = (elevation: number, opacity: number, radius: number, height: number) =>
  Platform.select({
    android: { elevation },
    default: {
      shadowColor: palette.navy900,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height },
    },
  });

export const shadows = {
  none: {},
  sm: shadow(1, 0.05, 8, 1),
  md: shadow(3, 0.08, 14, 3),
  lg: shadow(8, 0.1, 22, 6),
} as const;

export type ShadowToken = keyof typeof shadows;
