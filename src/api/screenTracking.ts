import { createNavigationContainerRef } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';

/** Untyped so nested tab route names (Home, Courses, …) resolve correctly. */
export const navigationRef = createNavigationContainerRef();

/** Combined student + staff app — switched when the signed-in role is known. */
let CLIENT: 'student-app' | 'staff-app' = 'student-app';

export function setScreenTrackingClient(role: 'student' | 'staff' | null | undefined) {
  CLIENT = role === 'staff' ? 'staff-app' : 'student-app';
  console.log('[screenTracking] client', CLIENT);
}

// One id per app launch. Memory only: never persist — close + reopen gets a new one.
const CLIENT_INSTANCE = Crypto.randomUUID();

/**
 * Set just before navigate so the first API call matches the destination.
 * Cleared on the next navigation state change.
 * Only SCREEN_MAP keys are used — never invent a key at the call site.
 */
let pendingScreen: { screen: string; ref?: string } | null = null;
let lastLoggedScreen: string | null = null;

type ScreenMapEntry = { key: string; refParam?: string; refParams?: string[] };

/**
 * Route name → server screen key (+ optional record id param).
 *
 * Intentionally untracked (auth / chat / containers):
 * Login, Signup, ForgotPassword, ResetPassword, Notifications,
 * Chat, ChatThread, MainTabs.
 */
const SCREEN_MAP: Record<string, ScreenMapEntry> = {
  // Tabs / home
  Home: { key: 'dashboard' },
  Dashboard: { key: 'dashboard' },
  Courses: { key: 'courses' },
  Calendar: { key: 'calendar' },
  Bookings: { key: 'bookings' },
  Groups: { key: 'groups' },
  Profile: { key: 'profile' },

  // Profile sub-screens
  EditProfile: { key: 'profile' },
  ChangePassword: { key: 'profile' },
  PrivacySecurity: { key: 'profile' },
  HelpSupport: { key: 'profile' },
  AboutKbm: { key: 'profile' },

  // Courses (+ lesson sub-screen)
  CourseDetail: { key: 'course_detail', refParam: 'courseId' },
  LessonPlayer: { key: 'course_content', refParam: 'courseId' },

  // Coursework (+ submissions / grading / file viewer)
  Coursework: { key: 'coursework' },
  CourseworkDetail: { key: 'coursework', refParam: 'courseworkId' },
  StaffCoursework: { key: 'coursework' },
  CourseworkSubmissions: { key: 'coursework_submissions', refParam: 'assignmentId' },
  CourseworkSubmissionDetail: { key: 'coursework_grading', refParam: 'assignmentId' },
  CourseworkFile: { key: 'coursework' },

  // Bookings (class / student booking detail — not practical training)
  BookClass: { key: 'bookings' },
  MyBookings: { key: 'bookings' },
  StaffBookingDetail: { key: 'bookings', refParam: 'bookingId' },
  ClassBookings: { key: 'bookings', refParam: 'classId' },
  SessionDetails: { key: 'bookings', refParam: 'sessionId' },

  // Practical training (book / location day / seats) — never use bookings
  BookTraining: { key: 'pt_shifts', refParam: 'date' },
  TrainingLocationBookings: { key: 'pt_shifts', refParams: ['dayId', 'date'] },
  BookingShifts: { key: 'pt_shifts' },
  BookingShiftDetail: { key: 'pt_shifts', refParam: 'bookingId' },
  PracticalShifts: { key: 'pt_shifts' },
  ShiftEditor: { key: 'pt_shifts', refParam: 'shiftId' },

  // Calendar (+ day agenda / closures / timetable)
  DayAgenda: { key: 'calendar', refParam: 'date' },
  EditTimetable: { key: 'calendar', refParam: 'classId' },
  CloseCalendar: { key: 'closures' },

  // Groups (+ group / session detail)
  GroupDetail: { key: 'group_detail', refParam: 'groupId' },
  GroupSessionDetail: { key: 'group_detail', refParam: 'groupId' },

  // Announcements (+ detail / editor)
  Announcements: { key: 'announcements' },
  AnnouncementDetail: { key: 'announcements', refParam: 'announcementId' },
  AnnouncementEditor: { key: 'announcements', refParam: 'announcementId' },

  // Users directory → list; open one user → allocations
  UserDirectory: { key: 'users' },
  UserDetail: { key: 'allocations', refParam: 'userId' },

  // Invoices / agreements (+ details)
  Invoices: { key: 'invoices' },
  InvoiceDetail: { key: 'invoices', refParam: 'invoiceId' },
  Agreements: { key: 'agreements' },
  AgreementDetail: { key: 'agreements', refParam: 'agreementId' },
};

function resolveRef(
  entry: ScreenMapEntry,
  params?: Record<string, unknown> | undefined,
): string | undefined {
  const keys = entry.refParams ?? (entry.refParam ? [entry.refParam] : []);
  for (const key of keys) {
    const raw = params?.[key];
    if (typeof raw === 'string' && raw.trim()) return raw;
  }
  return undefined;
}

function resolveFromRoute(
  routeName: string,
  params?: Record<string, unknown> | undefined,
): { screen: string; ref?: string } | null {
  const entry = SCREEN_MAP[routeName];
  if (!entry) return null;
  return { screen: entry.key, ref: resolveRef(entry, params) };
}

function logAccess(screen: string, ref: string | undefined, extra?: Record<string, unknown>) {
  const message = ref ? `Accessed ${screen} (${ref})` : `Accessed ${screen}`;
  console.log('[screenTracking]', message, extra ?? {});
}

/** Routes we expect to have no X-Screen — don't spam the console. */
const SILENT_UNTRACKED = new Set([
  'Login',
  'Signup',
  'ForgotPassword',
  'ResetPassword',
  'Notifications',
  'Chat',
  'ChatThread',
  'MainTabs',
]);

/**
 * In-screen event (e.g. calendar date tap) — no navigation, but still tags X-Screen.
 * `screen` must be a known server key (calendar, bookings, …).
 */
export function trackScreen(screen: string, ref?: string) {
  pendingScreen = { screen, ref: ref || undefined };
  logAccess(screen, ref, { pending: true, inScreen: true });
}

/**
 * Call immediately before `navigation.navigate(routeName, params)`.
 * Tags X-Screen from SCREEN_MAP for that route only — no guessed keys.
 */
export function trackRoute(routeName: string, params?: Record<string, unknown>) {
  const resolved = resolveFromRoute(routeName, params);
  if (!resolved) {
    pendingScreen = null;
    if (!SILENT_UNTRACKED.has(routeName)) {
      console.log('[screenTracking] click (untracked route)', { route: routeName });
    }
    return;
  }
  pendingScreen = resolved;
  logAccess(resolved.screen, resolved.ref, { pending: true, route: routeName });
}

export function clearPendingScreen() {
  pendingScreen = null;
}

export function screenKeyForRoute(routeName: string): string | undefined {
  return SCREEN_MAP[routeName]?.key;
}

/** Call from NavigationContainer `onStateChange`. */
export function onNavigationStateChange() {
  const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : undefined;

  // Booking / auth / chat flows must not inherit a prior screen (e.g. calendar date).
  if (route?.name && SILENT_UNTRACKED.has(route.name)) {
    pendingScreen = null;
    return;
  }

  const current = route
    ? resolveFromRoute(route.name, route.params as Record<string, unknown> | undefined)
    : null;

  // Prefer pending until the focused route matches it — avoids wiping a booking
  // tag when state change still reports Calendar mid-navigate.
  if (pendingScreen) {
    const matched =
      current != null &&
      current.screen === pendingScreen.screen &&
      (pendingScreen.ref == null || current.ref === pendingScreen.ref);
    if (matched) {
      pendingScreen = null;
      logAccess(current.screen, current.ref, { route: route?.name, client: CLIENT });
      return;
    }
    logAccess(pendingScreen.screen, pendingScreen.ref, {
      pending: true,
      route: route?.name,
      client: CLIENT,
    });
    return;
  }

  if (current) {
    logAccess(current.screen, current.ref, { route: route?.name, client: CLIENT });
    return;
  }

  if (route?.name) {
    console.log('[screenTracking] nav (untracked)', { route: route.name, client: CLIENT });
  }
}

function screenFromRoute(): { screen: string; ref?: string } | null {
  if (!navigationRef.isReady()) return null;
  const route = navigationRef.getCurrentRoute();
  if (!route) return null;
  return resolveFromRoute(route.name, route.params as Record<string, unknown> | undefined);
}

function currentScreen(): { screen: string; ref?: string } | null {
  if (pendingScreen) return pendingScreen;
  return screenFromRoute();
}

/** Headers for the shared fetch API client (and other CRM fetch callers). */
export function getScreenTrackingHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Client': CLIENT,
    'X-Client-Instance': CLIENT_INSTANCE,
  };
  const current = currentScreen();
  if (current) {
    headers['X-Screen'] = current.screen;
    if (current.ref) headers['X-Screen-Ref'] = current.ref;
  }
  const key = `${headers['X-Screen'] ?? ''}|${headers['X-Screen-Ref'] ?? ''}|${CLIENT}`;
  if (key !== lastLoggedScreen) {
    lastLoggedScreen = key;
    if (current) {
      logAccess(current.screen, current.ref, {
        'X-Client': CLIENT,
        'X-Screen': current.screen,
        'X-Screen-Ref': current.ref ?? null,
        pending: Boolean(pendingScreen),
      });
    } else {
      console.log('[screenTracking] headers (no X-Screen)', { 'X-Client': CLIENT });
    }
  }
  return headers;
}
