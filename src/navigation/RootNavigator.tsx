import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { tokens } from '@/theme';
import { LoginScreen } from '@/pages/auth/LoginScreen';
import { SignupScreen } from '@/pages/auth/SignupScreen';
import { CourseDetailScreen } from '@/pages/courses/CourseDetailScreen';
import { LessonPlayerScreen } from '@/pages/courses/LessonPlayerScreen';
import { DayAgendaScreen } from '@/pages/calendar/DayAgendaScreen';
import { SessionDetailsScreen } from '@/pages/calendar/SessionDetailsScreen';
import { ChatThreadScreen } from '@/pages/chat/ChatThreadScreen';
import { useAuthStore } from '@/store/useAuthStore';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.colors.background },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
          <Stack.Screen name="LessonPlayer" component={LessonPlayerScreen} />
          <Stack.Screen name="DayAgenda" component={DayAgendaScreen} />
          <Stack.Screen name="SessionDetails" component={SessionDetailsScreen} />
          <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
