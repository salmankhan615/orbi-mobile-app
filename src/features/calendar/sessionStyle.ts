import type { Ionicons } from '@expo/vector-icons';
import type { Session, SessionType } from '@/api/sessions';
import { tokens } from '@/theme';

/**
 * CRM calendar accents:
 * - navy/blue = already booked
 * - green = open / available to book
 * - grey/amber = past
 * - red = cancelled
 */
export const SESSION_TYPE_COLOR: Record<SessionType, keyof typeof tokens.colors> = {
  blue: 'categoryNavy',
  green: 'categoryGreen',
  amber: 'textMuted',
  red: 'categoryRed',
};

export const SESSION_TYPE_TINT: Record<
  SessionType,
  { bg: keyof typeof tokens.colors; fg: keyof typeof tokens.colors }
> = {
  blue: { bg: 'primaryMuted', fg: 'primary' },
  green: { bg: 'successMuted', fg: 'success' },
  amber: { bg: 'surfaceAlt', fg: 'textMuted' },
  red: { bg: 'dangerMuted', fg: 'danger' },
};

export const SESSION_TYPE_ICON: Record<SessionType, keyof typeof Ionicons.glyphMap> = {
  blue: 'checkmark-circle-outline',
  green: 'calendar-outline',
  amber: 'time-outline',
  red: 'close-circle-outline',
};

export function sessionAccentColor(session: Session): keyof typeof tokens.colors {
  return SESSION_TYPE_COLOR[session.type];
}

function isActiveBooking(session: Session): boolean {
  if (session.type === 'blue') return true;
  const mb = session.myBooking;
  if (!mb) return false;
  return !(mb.status ?? '').toLowerCase().includes('cancel');
}

/** Month/week day markers: green ring = booked, purple dots = available. */
export function daySessionMarkers(sessions: Session[]): {
  hasBooked: boolean;
  availableCount: number;
} {
  let hasBooked = false;
  let availableCount = 0;
  for (const session of sessions) {
    if (isActiveBooking(session)) hasBooked = true;
    else if (session.type === 'green') availableCount += 1;
  }
  return { hasBooked, availableCount };
}
