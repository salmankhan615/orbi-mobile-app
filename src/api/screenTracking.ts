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

/**
 * Route name → server screen key (+ optional record id param).
 *
 * Intentionally untracked (auth / chat / booking flow / containers):
 * Login, Signup, ForgotPassword, ResetPassword, Notifications,
 * Chat, ChatThread, BookTraining, SessionDetails, MainTabs.
 */
const SCREEN_MAP: Record<string, { key: string; refParam?: string }> = {
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

  // Bookings (+ class / training / shift detail sub-screens)
  BookClass: { key: 'bookings' },
  MyBookings: { key: 'bookings' },
  StaffBookingDetail: { key: 'bookings', refParam: 'bookingId' },
  ClassBookings: { key: 'bookings', refParam: 'classId' },
  TrainingLocationBookings: { key: 'bookings', refParam: 'dayId' },
  BookingShifts: { key: 'bookings' },
  BookingShiftDetail: { key: 'bookings', refParam: 'bookingId' },

  // Calendar (+ day agenda / closures / timetable / PT shifts)
  DayAgenda: { key: 'calendar', refParam: 'date' },
  EditTimetable: { key: 'calendar', refParam: 'classId' },
  CloseCalendar: { key: 'closures' },
  PracticalShifts: { key: 'pt_shifts' },
  ShiftEditor: { key: 'pt_shifts', refParam: 'shiftId' },

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

function resolveFromRoute(
  routeName: string,
  params?: Record<string, unknown> | undefined,
): { screen: string; ref?: string } | null {
  const entry = SCREEN_MAP[routeName];
  if (!entry) return null;
  const raw = entry.refParam ? params?.[entry.refParam] : undefined;
  return { screen: entry.key, ref: typeof raw === 'string' ? raw : undefined };
}

function logAccess(screen: string, ref: string | undefined, extra?: Record<string, unknown>) {
  const message = ref ? `Accessed ${screen} (${ref})` : `Accessed ${screen}`;
  console.log('[screenTracking]', message, extra ?? {});
}

/**
 * Call immediately before `navigation.navigate(routeName, params)`.
 * Tags X-Screen from SCREEN_MAP for that route only — no guessed keys.
 */
/** Routes we expect to have no X-Screen — don't spam the console. */
const SILENT_UNTRACKED = new Set([
  'Login',
  'Signup',
  'ForgotPassword',
  'ResetPassword',
  'Notifications',
  'Chat',
  'ChatThread',
  'BookTraining',
  'SessionDetails',
  'MainTabs',
]);

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
  pendingScreen = null;
  const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : undefined;
  const current = route
    ? resolveFromRoute(route.name, route.params as Record<string, unknown> | undefined)
    : null;
  if (current) {
    logAccess(current.screen, current.ref, { route: route?.name, client: CLIENT });
  } else if (route?.name && !SILENT_UNTRACKED.has(route.name)) {
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
