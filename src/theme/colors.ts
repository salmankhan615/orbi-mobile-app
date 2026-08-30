// Tertiary scheme: deep blue + royal purple + gold.
// Green stays semantic (complete / attendance). KBM red is logo/danger only.
export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  blue950: '#0C1528',
  blue900: '#15233F',
  blue800: '#1E3358',
  blue700: '#2A4470',

  purple50: '#F3F0F8',
  purple100: '#E6DFF0',
  purple500: '#6B5B95',
  purple700: '#4F3F78',
  purple800: '#3D2F5C',

  gold50: '#FBF6E8',
  gold100: '#F4E8C4',
  gold500: '#D4B13A',
  gold600: '#C4A02A',
  gold700: '#9A7C18',

  green50: '#EAF6EF',
  green500: '#2F9E5C',
  green600: '#1F7A4C',

  red50: '#FDECEC',
  red500: '#E11D21',
  red600: '#C8102E',

  gray50: '#F4F5F8',
  gray100: '#EBEDF2',
  gray200: '#DDE1EA',
  gray300: '#C5CBD6',
  gray400: '#8B93A4',
  gray500: '#6B7280',
  gray600: '#4B5563',

  teal500: '#0D9488',
  teal700: '#0F766E',
  tealSoft: '#E6F7F5',
  amber500: '#F59E0B',
  amber700: '#B45309',
} as const;

export const colors = {
  background: palette.gray50,
  surface: palette.white,
  surfaceAlt: palette.gray100,
  surfaceMuted: palette.gray200,
  border: palette.gray200,
  borderStrong: palette.gray300,

  textPrimary: palette.blue900,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  textInverse: palette.white,

  primary: palette.blue900,
  primaryHover: palette.blue800,
  primaryMuted: palette.gray100,
  primarySubtle: palette.gray50,
  onPrimary: palette.white,

  secondary: palette.purple700,
  secondaryHover: palette.purple800,
  secondaryMuted: palette.purple50,
  onSecondary: palette.white,

  tertiary: palette.gold600,
  tertiaryHover: palette.gold700,
  tertiaryMuted: palette.gold50,
  onTertiary: palette.blue900,

  accent: palette.red600,
  accentHover: palette.red500,
  accentMuted: palette.red50,
  onAccent: palette.white,

  success: palette.green600,
  successMuted: palette.green50,
  warning: palette.gold600,
  warningMuted: palette.gold50,
  danger: palette.red600,
  dangerMuted: palette.red50,
  info: palette.purple500,
  infoMuted: palette.purple50,

  categoryNavy: palette.blue800,
  categoryTeal: palette.teal500,
  categoryPurple: palette.purple500,
  categoryAmber: palette.gold500,
  categoryRed: palette.red500,
  categoryGreen: palette.green500,
  categoryBlue: palette.blue700,
  categoryTealMuted: palette.tealSoft,
  categoryPurpleMuted: palette.purple50,

  overlay: 'rgba(21, 35, 63, 0.45)',
  transparent: 'transparent',
  glassTint: 'rgba(255, 255, 255, 0.16)',
  glassBorder: 'rgba(255, 255, 255, 0.28)',
} as const;

export type ColorToken = keyof typeof colors;
