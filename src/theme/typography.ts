// Poppins — geometric, friendly LMS feel matching the product reference.
// Family names must match App.tsx useFonts() keys.
export const fontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  // Poppins tops out usefully at Bold for UI — map heavier tokens to Bold
  // so callers don't accidentally reach for missing ExtraBold files.
  extrabold: 'Poppins_700Bold',
  black: 'Poppins_700Bold',
} as const;

// Calm product scale — titles stay readable, never shout.
export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 15,
  xl: 17,
  xxl: 22,
  xxxl: 26,
} as const;

export const lineHeight = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 22,
  xl: 24,
  xxl: 28,
  xxxl: 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '700',
  black: '700',
} as const;

export type FontSizeToken = keyof typeof fontSize;
