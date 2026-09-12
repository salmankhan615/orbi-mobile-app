import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string; token?: string } | undefined;
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
  BookTraining: { date?: string } | undefined;
  MyBookings: undefined;
  Coursework: { tab?: 'assignment' | 'resource' } | undefined;
  CourseworkDetail: { courseworkId: string };
  CourseworkFile: { url: string; filename: string; type: string };
  EditProfile: undefined;
  ChangePassword: undefined;
  PrivacySecurity: undefined;
  HelpSupport: undefined;
  AboutKbm: undefined;
  StaffBookingDetail: { bookingId: string };
  GroupDetail: { groupId: string };
  GroupSessionDetail: {
    groupId: string;
    classId: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  UserDirectory: undefined;
  UserDetail: {
    userId: string;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
  };
  StaffCoursework: undefined;
  CourseworkSubmissions: { assignmentId: string };
  CourseworkSubmissionDetail: {
    assignmentId: string;
    submissionId: string;
    studentName: string;
    submittedAt: string;
    status: string;
    grade?: string;
    files?: { url: string; filename: string; type: string }[];
    comments?: { id: string; text: string; authorRole?: string; createdAt?: string }[];
  };
  Invoices: undefined;
  InvoiceDetail: {
    invoiceId: string;
    studentName: string;
    amountLabel: string;
    status: 'paid' | 'due' | 'overdue';
    issuedOn: string;
  };
  Agreements: undefined;
  AgreementDetail: {
    agreementId: string;
    title: string;
    studentName: string;
    status: 'pending' | 'signed' | 'expired';
    submittedOn: string;
  };
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
