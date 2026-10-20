import { createNavigationContainerRef } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';

/** Untyped so nested tab route names (Home, Courses, …) resolve correctly. */
export const navigationRef = createNavigationContainerRef();

/** Combined student + staff app — switched when the signed-in role is known. */
let CLIENT: 'student-app' | 'staff-app' = 'student-app';

export function setScreenTrackingClient(role: 'student' | 'staff' | null | undefined) {
  CLIENT = role === 'staff' ? 'staff-app' : 'student-app';
}

// One id per app launch. Memory only: never persist — close + reopen gets a new one.
const CLIENT_INSTANCE = Crypto.randomUUID();

/**
 * Route name → server screen key (+ which route param holds the record id).
 * Routes not listed send no X-Screen (Profile, Login, Settings, etc.).
 */
const SCREEN_MAP: Record<string, { key: string; refParam?: string }> = {
  // Tabs / home
  Home: { key: 'dashboard' },
  Dashboard: { key: 'dashboard' },
  Courses: { key: 'courses' },
  Calendar: { key: 'calendar' },
  Bookings: { key: 'bookings' },
  Groups: { key: 'groups' },

  // Courses
  CourseDetail: { key: 'course_detail', refParam: 'courseId' },
  LessonPlayer: { key: 'course_content', refParam: 'courseId' },

  // Coursework (student + staff list — view only; no create/edit)
  Coursework: { key: 'coursework' },
  CourseworkDetail: { key: 'coursework' },
  StaffCoursework: { key: 'coursework' },
  // Submissions list (staff "Submissions" button) vs grading a single submission
  CourseworkSubmissions: { key: 'coursework_submissions' },
  CourseworkSubmissionDetail: { key: 'coursework_grading' },

  // Bookings / calendar extras (BookTraining omitted — booking flow, not a bookings list view)
  BookClass: { key: 'bookings' },
  MyBookings: { key: 'bookings' },
  StaffBookingDetail: { key: 'bookings' },
  ClassBookings: { key: 'bookings' },
  TrainingLocationBookings: { key: 'bookings' },
  BookingShifts: { key: 'bookings' },
  BookingShiftDetail: { key: 'bookings' },
  // DayAgenda / SessionDetails omitted — booking detail flows, not the Calendar tab
  CloseCalendar: { key: 'closures' },
  PracticalShifts: { key: 'pt_shifts' },
  ShiftEditor: { key: 'pt_shifts' },

  // Groups
  GroupDetail: { key: 'group_detail', refParam: 'groupId' },
  GroupSessionDetail: { key: 'group_detail', refParam: 'groupId' },

  // Announcements
  Announcements: { key: 'announcements' },
  AnnouncementDetail: { key: 'announcements' },
  AnnouncementEditor: { key: 'announcements' },

  // UserDetail omitted — opening a user profile is not an allocations view
};

function currentScreen(): { screen: string; ref?: string } | null {
  if (!navigationRef.isReady()) return null;
  const route = navigationRef.getCurrentRoute();
  const entry = route ? SCREEN_MAP[route.name] : undefined;
  if (!entry) return null;
  const params = route?.params as Record<string, unknown> | undefined;
  const raw = entry.refParam ? params?.[entry.refParam] : undefined;
  return { screen: entry.key, ref: typeof raw === 'string' ? raw : undefined };
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
  return headers;
}
