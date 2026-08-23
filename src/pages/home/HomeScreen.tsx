import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/custom/Screen';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { useCourses } from '@/queries/useCourses';
import { useSessions } from '@/queries/useSessions';
import { useAuthStore } from '@/store/useAuthStore';
import { CourseSummaryCard } from '@/features/courses/components/CourseSummaryCard';
import { SessionListItem } from '@/features/calendar/components/SessionListItem';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Home'>;

export function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const { data: courses } = useCourses();
  const { data: sessions } = useSessions();
  const [query, setQuery] = useState('');

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const upcomingSessions = (sessions ?? []).slice(0, 2);
  const filteredCourses = (courses ?? []).filter((course) =>
    query.trim() ? course.title.toLowerCase().includes(query.trim().toLowerCase()) : true,
  );

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text variant="largeTitle">Hi, {firstName} 👋</Text>
            <Text variant="bodySmall" color="textSecondary" style={styles.subtitle}>
              Let&apos;s continue your learning journey.
            </Text>
          </View>
          <IconButton name="notifications-outline" background="surface" />
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={tokens.colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search courses..."
            placeholderTextColor={tokens.colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <View style={styles.filterBtn}>
            <Ionicons name="options-outline" size={18} color={tokens.colors.primary} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="title">My Courses</Text>
          <ScalePressable onPress={() => navigation.navigate('Courses')} haptic={false}>
            <Text variant="bodySmall" color="success" style={styles.link}>
              See all
            </Text>
          </ScalePressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseRow}
        >
          {filteredCourses.map((course, index) => (
            <CourseSummaryCard
              key={course.id}
              course={course}
              index={index}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
            />
          ))}
        </ScrollView>

        <ScalePressable onPress={() => navigation.navigate('Calendar')} style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="calendar" size={22} color={tokens.colors.success} />
          </View>
          <View style={styles.bannerBody}>
            <Text variant="bodySmall" style={styles.bannerTitle}>
              Stay on track
            </Text>
            <Text variant="caption" color="textSecondary">
              Keep learning consistently to achieve your goals.
            </Text>
          </View>
          <View style={styles.bannerCta}>
            <Text variant="caption" color="onPrimary" style={styles.bannerCtaLabel}>
              Go to Calendar
            </Text>
            <Ionicons name="arrow-forward" size={12} color={tokens.colors.onPrimary} />
          </View>
        </ScalePressable>

        <View style={styles.sectionHeader}>
          <Text variant="title">Upcoming Sessions</Text>
          <ScalePressable onPress={() => navigation.navigate('Calendar')} haptic={false}>
            <Text variant="bodySmall" color="success" style={styles.link}>
              See all
            </Text>
          </ScalePressable>
        </View>

        {upcomingSessions.map((session, index) => (
          <SessionListItem
            key={session.id}
            session={session}
            index={index}
            onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: tokens.spacing.screen,
    backgroundColor: tokens.colors.surface,
  },
  content: {
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.xxxl,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  greetingCopy: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  subtitle: {
    marginTop: tokens.spacing.xxs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.lg,
    paddingLeft: tokens.spacing.md,
    paddingRight: tokens.spacing.sm,
    height: 48,
    marginBottom: tokens.spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.fontSize.md,
    fontFamily: tokens.fontFamily.regular,
    color: tokens.colors.textPrimary,
    padding: 0,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  link: {
    fontFamily: tokens.fontFamily.medium,
  },
  courseRow: {
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.successMuted,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBody: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  bannerCtaLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
