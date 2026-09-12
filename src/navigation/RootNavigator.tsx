import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { tokens } from '@/theme';
import { LoginScreen } from '@/pages/auth/LoginScreen';
import { SignupScreen } from '@/pages/auth/SignupScreen';
import { ForgotPasswordScreen } from '@/pages/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/pages/auth/ResetPasswordScreen';
import { CourseDetailScreen } from '@/pages/courses/CourseDetailScreen';
import { LessonPlayerScreen } from '@/pages/courses/LessonPlayerScreen';
import { DashboardScreen } from '@/pages/home/DashboardScreen';
import { DayAgendaScreen } from '@/pages/calendar/DayAgendaScreen';
import { SessionDetailsScreen } from '@/pages/calendar/SessionDetailsScreen';
import { ChatThreadScreen } from '@/pages/chat/ChatThreadScreen';
import { NotificationsScreen } from '@/pages/common/NotificationsScreen';
import { AnnouncementsScreen } from '@/pages/common/AnnouncementsScreen';
import { AnnouncementDetailScreen } from '@/pages/common/AnnouncementDetailScreen';
import { AnnouncementEditorScreen } from '@/pages/staff/AnnouncementEditorScreen';
import { BookClassScreen } from '@/pages/student/BookClassScreen';
import { BookTrainingScreen } from '@/pages/student/BookTrainingScreen';
import { MyBookingsScreen } from '@/pages/student/MyBookingsScreen';
import { StudentCourseworkScreen } from '@/pages/student/StudentCourseworkScreen';
import { CourseworkDetailScreen } from '@/pages/student/CourseworkDetailScreen';
import { CourseworkFileScreen } from '@/pages/student/CourseworkFileScreen';
import { EditProfileScreen } from '@/pages/common/EditProfileScreen';
import { ChangePasswordScreen } from '@/pages/common/ChangePasswordScreen';
import {
  PrivacySecurityScreen,
  HelpSupportScreen,
  AboutKbmScreen,
} from '@/pages/common/InfoScreens';
import { StaffBookingDetailScreen } from '@/pages/staff/StaffBookingDetailScreen';
import { GroupDetailScreen } from '@/pages/staff/GroupDetailScreen';
import { UserDirectoryScreen } from '@/pages/staff/UserDirectoryScreen';
import { StaffCourseworkScreen } from '@/pages/staff/StaffCourseworkScreen';
import { CourseworkSubmissionsScreen } from '@/pages/staff/CourseworkSubmissionsScreen';
import {
  InvoicesScreen,
  AgreementsScreen,
  BookingShiftsScreen,
  CloseCalendarScreen,
} from '@/pages/staff/StaffOpsScreens';
import { setUnauthorizedHandler } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role ?? 'student');
  const sessionExpiresAt = useAuthStore((state) => state.sessionExpiresAt);
  const signOut = useAuthStore((state) => state.signOut);
  const isStaff = role === 'staff';

  // CRM rejects an expired/revoked token with 401 — drop the local session too.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;
    const remaining = sessionExpiresAt - Date.now();
    if (remaining <= 0) {
      signOut();
      return;
    }
    const timer = setTimeout(signOut, remaining);
    return () => clearTimeout(timer);
  }, [isAuthenticated, sessionExpiresAt, signOut]);

  return (
    <Stack.Navigator
      key={isAuthenticated ? `app-${role}` : 'auth'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.colors.background },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
          <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="AboutKbm" component={AboutKbmScreen} />

          {isStaff ? (
            <>
              <Stack.Screen name="AnnouncementEditor" component={AnnouncementEditorScreen} />
              <Stack.Screen name="StaffBookingDetail" component={StaffBookingDetailScreen} />
              <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
              <Stack.Screen name="UserDirectory" component={UserDirectoryScreen} />
              <Stack.Screen name="StaffCoursework" component={StaffCourseworkScreen} />
              <Stack.Screen name="CourseworkSubmissions" component={CourseworkSubmissionsScreen} />
              <Stack.Screen name="Invoices" component={InvoicesScreen} />
              <Stack.Screen name="Agreements" component={AgreementsScreen} />
              <Stack.Screen name="CloseCalendar" component={CloseCalendarScreen} />
              <Stack.Screen name="BookingShifts" component={BookingShiftsScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
              <Stack.Screen name="LessonPlayer" component={LessonPlayerScreen} />
              <Stack.Screen name="DayAgenda" component={DayAgendaScreen} />
              <Stack.Screen name="SessionDetails" component={SessionDetailsScreen} />
              <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
              <Stack.Screen name="BookClass" component={BookClassScreen} />
              <Stack.Screen name="BookTraining" component={BookTrainingScreen} />
              <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
              <Stack.Screen name="Coursework" component={StudentCourseworkScreen} />
              <Stack.Screen name="CourseworkDetail" component={CourseworkDetailScreen} />
              <Stack.Screen name="CourseworkFile" component={CourseworkFileScreen} />
            </>
          )}
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
