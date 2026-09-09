import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  MainTabs: undefined;
  Dashboard: undefined;
  CourseDetail: { courseId: string };
  LessonPlayer: { courseId: string; lessonId: string };
  DayAgenda: { date: string; calendarId?: string };
  SessionDetails: { sessionId: string };
  ChatThread: { conversationId: string };
  Notifications: undefined;
  Announcements: undefined;
  AnnouncementDetail: { announcementId: string };
  AnnouncementEditor: { announcementId?: string };
  BookClass: undefined;
  BookTraining: undefined;
  MyBookings: undefined;
  Coursework: { tab?: 'assignment' | 'resource' } | undefined;
  CourseworkDetail: { courseworkId: string };
  CourseworkFile: { url: string; filename: string; type: string };
  EditProfile: undefined;
  PrivacySecurity: undefined;
  HelpSupport: undefined;
  AboutKbm: undefined;
  StaffBookingDetail: { bookingId: string };
  GroupDetail: { groupId: string };
  UserDirectory: undefined;
  StaffCoursework: undefined;
  CourseworkSubmissions: { assignmentId: string };
  Invoices: undefined;
  Agreements: undefined;
  CloseCalendar: undefined;
  BookingShifts: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  Calendar: undefined;
  Chat: undefined;
  Bookings: undefined;
  Groups: undefined;
  More: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- required shape for React Navigation's global type augmentation
    interface RootParamList extends RootStackParamList {}
  }
}
