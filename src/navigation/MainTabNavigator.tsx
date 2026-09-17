import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/pages/home/HomeScreen';
import { CoursesListScreen } from '@/pages/courses/CoursesListScreen';
import { CalendarScreen } from '@/pages/calendar/CalendarScreen';
import { ChatListScreen } from '@/pages/chat/ChatListScreen';
import { ProfileScreen } from '@/pages/ProfileScreen';
import { StaffHomeScreen } from '@/pages/staff/StaffHomeScreen';
import { StaffBookingsScreen } from '@/pages/staff/StaffBookingsScreen';
import { StaffGroupsScreen } from '@/pages/staff/StaffGroupsScreen';
import { useAuthStore } from '@/store/useAuthStore';
import { useCrmUser } from '@/queries/useAuth';
import { CustomTabBar } from './CustomTabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  useCrmUser();
  const role = useAuthStore((state) => state.user?.role ?? 'student');
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const canBookings = role === 'staff' && permissions.includes('view_bookings');
  const canGroups = role === 'staff' && permissions.includes('view_groups');
  const canCalendar = role === 'staff' && permissions.includes('view_calendar');

  if (role === 'staff') {
    return (
      <Tab.Navigator
        key={`staff-tabs-${canCalendar ? 'c' : ''}${canBookings ? 'b' : ''}${canGroups ? 'g' : ''}`}
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={StaffHomeScreen} options={{ title: 'Overview' }} />
        {canCalendar ? <Tab.Screen name="Calendar" component={CalendarScreen} /> : null}
        {canBookings ? <Tab.Screen name="Bookings" component={StaffBookingsScreen} /> : null}
        {canGroups ? <Tab.Screen name="Groups" component={StaffGroupsScreen} /> : null}
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      key="student-tabs"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Courses" component={CoursesListScreen} options={{ title: 'Courses' }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
