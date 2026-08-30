import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/pages/home/HomeScreen';
import { StaffHomeScreen } from '@/pages/staff/StaffHomeScreen';
import { CoursesListScreen } from '@/pages/courses/CoursesListScreen';
import { CalendarScreen } from '@/pages/calendar/CalendarScreen';
import { ChatListScreen } from '@/pages/chat/ChatListScreen';
import { ProfileScreen } from '@/pages/ProfileScreen';
import { StaffBookingsScreen } from '@/pages/staff/StaffBookingsScreen';
import { StaffGroupsScreen } from '@/pages/staff/StaffGroupsScreen';
import { StaffMoreScreen } from '@/pages/staff/StaffMoreScreen';
import { useAuthStore } from '@/store/useAuthStore';
import { CustomTabBar } from './CustomTabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const role = useAuthStore((state) => state.user?.role ?? 'student');

  if (role === 'staff') {
    return (
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={StaffHomeScreen} options={{ title: 'Overview' }} />
        <Tab.Screen name="Bookings" component={StaffBookingsScreen} />
        <Tab.Screen name="Groups" component={StaffGroupsScreen} />
        <Tab.Screen name="More" component={StaffMoreScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
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
