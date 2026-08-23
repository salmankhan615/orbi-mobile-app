// Reference LMS palette: deep navy primary + forest green accents on soft white.
// KBM red stays available for brand/danger only — not chrome.
export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  navy950: '#061525',
  navy900: '#0A2540',
  navy800: '#123356',
  navy700: '#1A456E',

  green50: '#EAF6EF',
  green100: '#D4EDDD',
  green500: '#2F9E5C',
  green600: '#1F7A4C',
  green700: '#16603B',

  red50: '#FDECEC',
  red500: '#E11D21',
  red600: '#C8102E',

  gray50: '#F5F7FA',
  gray100: '#EEF1F6',
  gray200: '#E3E8EF',
  gray300: '#CDD5E0',
  gray400: '#9AA3B2',
  gray500: '#6B7280',
  gray600: '#4B5563',

  teal500: '#0D9488',
  teal700: '#0F766E',
  tealSoft: '#E6F7F5',
  purple500: '#7C3AED',
  purple700: '#5B21B6',
  purpleSoft: '#F3E8FF',
  amber500: '#F59E0B',
  amber700: '#B45309',
  amberSoft: '#FFF7E6',
  blue500: '#3B82F6',
  blueSoft: '#EAF2FE',
} as const;

export const colors = {
  background: palette.gray50,
  surface: palette.white,
  surfaceAlt: palette.gray100,
  surfaceMuted: palette.gray200,
  border: palette.gray200,
  borderStrong: palette.gray300,

  textPrimary: palette.navy900,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  textInverse: palette.white,

  primary: palette.navy900,
  primaryHover: palette.navy800,
  primaryMuted: palette.gray100,
  primarySubtle: palette.gray50,
  onPrimary: palette.white,

  // Brand spark (logo / danger) — not primary UI chrome
  accent: palette.red600,
  accentHover: palette.red500,
  accentMuted: palette.red50,
  onAccent: palette.white,

  // Forest green — progress, active tabs, "Upcoming", positive CTAs
  success: palette.green600,
  successMuted: palette.green50,
  warning: palette.amber500,
  warningMuted: palette.amberSoft,
  danger: palette.red600,
  dangerMuted: palette.red50,
  info: palette.blue500,
  infoMuted: palette.blueSoft,

  categoryNavy: palette.navy800,
  categoryTeal: palette.teal500,
  categoryPurple: palette.purple500,
  categoryAmber: palette.amber500,
  categoryRed: palette.red500,
  categoryGreen: palette.green500,
  categoryBlue: palette.blue500,
  categoryTealMuted: palette.tealSoft,
  categoryPurpleMuted: palette.purpleSoft,

  overlay: 'rgba(10, 37, 64, 0.45)',
  transparent: 'transparent',
  glassTint: 'rgba(255, 255, 255, 0.16)',
  glassBorder: 'rgba(255, 255, 255, 0.28)',
} as const;

export type ColorToken = keyof typeof colors;
