import { palette } from './colors';

// brand* for heroes/CTAs; category* for course media bands (reference style).
export const gradients = {
  brand: [palette.navy800, palette.navy950] as const,
  brandAccent: [palette.navy900, palette.navy700] as const,
  accent: [palette.green500, palette.green700] as const,
  softWash: [palette.white, palette.gray50] as const,
  categoryNavy: [palette.navy700, palette.teal700] as const,
  categoryTeal: [palette.teal500, palette.teal700] as const,
  categoryPurple: [palette.purple500, palette.purple700] as const,
  categoryAmber: [palette.amber500, palette.amber700] as const,
} as const;

export type GradientToken = keyof typeof gradients;
