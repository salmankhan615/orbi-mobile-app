import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  CourseDetail: { courseId: string };
  LessonPlayer: { courseId: string; lessonId: string };
  DayAgenda: { date: string };
  SessionDetails: { sessionId: string };
  ChatThread: { conversationId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  Calendar: undefined;
  Chat: undefined;
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
