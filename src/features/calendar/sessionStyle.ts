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

/**
 * Month/week day markers:
 * - green ring = at least one booked session
 * - colored dots = open / past / cancelled (and booked when ring isn't enough alone)
 */
export function daySessionMarkers(sessions: Session[]): {
  hasBooked: boolean;
  availableCount: number;
  /** Up to 3 status dots to render under the day number. */
  dots: SessionType[];
} {
  let hasBooked = false;
  let availableCount = 0;
  const seen = new Set<SessionType>();
  const dots: SessionType[] = [];

  const pushDot = (type: SessionType) => {
    if (seen.has(type) || dots.length >= 3) return;
    seen.add(type);
    dots.push(type);
  };

  for (const session of sessions) {
    if (isActiveBooking(session)) {
      hasBooked = true;
      pushDot('blue');
      continue;
    }
    if (session.type === 'green') {
      availableCount += 1;
      pushDot('green');
      continue;
    }
    if (session.type === 'amber') {
      pushDot('amber');
      continue;
    }
    if (session.type === 'red') {
      pushDot('red');
    }
  }

  // Prefer showing open/past/cancelled dots under a booked ring (matches CRM chips).
  if (hasBooked) {
    const withoutBooked = dots.filter((type) => type !== 'blue');
    if (withoutBooked.length > 0) {
      return { hasBooked, availableCount, dots: withoutBooked.slice(0, 3) };
    }
  }

  return { hasBooked, availableCount, dots };
}
