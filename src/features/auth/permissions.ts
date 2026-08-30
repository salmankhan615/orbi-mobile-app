export type UserRole = 'student' | 'staff';

export type StaffPermission =
  | 'view_bookings'
  | 'mark_attendance'
  | 'cancel_booking'
  | 'view_groups'
  | 'view_group_sessions'
  | 'view_users'
  | 'view_coursework'
  | 'view_submissions'
  | 'view_invoices'
  | 'view_agreements'
  | 'view_announcements'
  | 'manage_announcements'
  | 'close_calendar'
  | 'view_shifts';

export const ALL_STAFF_PERMISSIONS: StaffPermission[] = [
  'view_bookings',
  'mark_attendance',
  'cancel_booking',
  'view_groups',
  'view_group_sessions',
  'view_users',
  'view_coursework',
  'view_submissions',
  'view_invoices',
  'view_agreements',
  'view_announcements',
  'manage_announcements',
  'close_calendar',
  'view_shifts',
];

/** Matches typical KBM web session length (7 days). */
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
