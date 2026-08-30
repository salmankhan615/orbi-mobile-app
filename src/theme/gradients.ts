import { palette } from './colors';

export const gradients = {
  brand: [palette.blue800, palette.purple800] as const,
  brandAccent: [palette.blue900, palette.blue700] as const,
  accent: [palette.gold500, palette.gold700] as const,
  softWash: [palette.white, palette.gray50] as const,
  categoryNavy: [palette.blue700, palette.purple700] as const,
  categoryTeal: [palette.teal500, palette.teal700] as const,
  categoryPurple: [palette.purple500, palette.purple800] as const,
  categoryAmber: [palette.gold500, palette.gold700] as const,
} as const;

export type GradientToken = keyof typeof gradients;
