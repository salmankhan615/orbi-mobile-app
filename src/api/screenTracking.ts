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

  // Coursework (student + staff list/editor)
  Coursework: { key: 'coursework' },
  CourseworkDetail: { key: 'coursework' },
  StaffCoursework: { key: 'coursework' },
  CourseworkEditor: { key: 'coursework' },
  CourseworkSubmissions: { key: 'coursework_grading' },
  CourseworkSubmissionDetail: { key: 'coursework_grading' },

  // Bookings / calendar extras
  BookClass: { key: 'bookings' },
  BookTraining: { key: 'bookings' },
  MyBookings: { key: 'bookings' },
  StaffBookingDetail: { key: 'bookings' },
  ClassBookings: { key: 'bookings' },
  TrainingLocationBookings: { key: 'bookings' },
  BookingShifts: { key: 'bookings' },
  BookingShiftDetail: { key: 'bookings' },
  DayAgenda: { key: 'calendar' },
  SessionDetails: { key: 'calendar' },
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

  // Staff allocations for a student
  UserDetail: { key: 'allocations', refParam: 'userId' },
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
