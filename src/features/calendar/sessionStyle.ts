import type { Ionicons } from '@expo/vector-icons';
import type { SessionType } from '@/api/sessions';
import { tokens } from '@/theme';

export const SESSION_TYPE_COLOR: Record<SessionType, keyof typeof tokens.colors> = {
  green: 'categoryGreen',
  red: 'categoryRed',
  amber: 'categoryAmber',
  blue: 'categoryBlue',
};

export const SESSION_TYPE_TINT: Record<
  SessionType,
  { bg: keyof typeof tokens.colors; fg: keyof typeof tokens.colors }
> = {
  green: { bg: 'successMuted', fg: 'success' },
  red: { bg: 'dangerMuted', fg: 'danger' },
  amber: { bg: 'warningMuted', fg: 'warning' },
  blue: { bg: 'infoMuted', fg: 'info' },
};

export const SESSION_TYPE_ICON: Record<SessionType, keyof typeof Ionicons.glyphMap> = {
  green: 'desktop-outline',
  red: 'document-text-outline',
  amber: 'calculator-outline',
  blue: 'business-outline',
};
