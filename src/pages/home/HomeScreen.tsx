import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { BellButton } from '@/components/custom/BellButton';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { AnnouncementModal } from '@/features/announcements/components/AnnouncementModal';
import { HomePulseCard } from '@/features/home/components/HomePulseCard';
import { buildStudentDashboard, EMPTY_DASHBOARD } from '@/features/home/dashboardStats';
import { useAllocatedCoursePacks, useCourses } from '@/queries/useCourses';
import { useAnnouncements, useAcknowledgeAnnouncement } from '@/queries/useAnnouncements';
import { useStudentBootstrap } from '@/queries/useBootstrap';
import { useAuthStore } from '@/store/useAuthStore';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothScrollProps } from '@/utils/scroll';
import { CourseSummaryCard } from '@/features/courses/components/CourseSummaryCard';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Home'>;

export function HomeScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data: bootstrap } = useStudentBootstrap();
  const packsQuery = useAllocatedCoursePacks();
  const { data: courses, allocateError, missingCompanyId } = useCourses();
  const { data: announcements } = useAnnouncements('students');
  const acknowledgeAnnouncement = useAcknowledgeAnnouncement();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (bootstrap?.user) updateUser(bootstrap.user);
  }, [bootstrap?.user, updateUser]);

  const dashboard = useMemo(() => {
    const allocatedCourses =
      packsQuery.data && packsQuery.data.length > 0
        ? packsQuery.data
        : (bootstrap?.allocatedCourses ?? []);
    if (!bootstrap && allocatedCourses.length === 0) return EMPTY_DASHBOARD;
    return buildStudentDashboard({
      allocations: bootstrap?.allocations ?? [],
      allocatedCourses,
      classCalendar: bootstrap?.classCalendar ?? [],
      practicalBookings: bootstrap?.practicalBookings ?? [],
      settings: bootstrap?.settings ?? null,
      userId: bootstrap?.user.id ?? user?.id,
    });
  }, [bootstrap, packsQuery.data, user?.id]);

  const firstName = bootstrap?.user.firstName ?? user?.firstName ?? 'there';
  const filteredCourses = (courses ?? []).filter((course) =>
    query.trim() ? course.title.toLowerCase().includes(query.trim().toLowerCase()) : true,
  );
  const pendingAnnouncement = (announcements ?? []).find((item) => !item.isAcknowledged);
  const showAnnouncementModal = Boolean(pendingAnnouncement);

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        keyboardShouldPersistTaps="handled"
        {...smoothScrollProps}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text variant="largeTitle">Hi, {firstName}</Text>
            <Text variant="bodySmall" color="textSecondary" style={styles.subtitle}>
              Let&apos;s continue your learning journey.
            </Text>
          </View>
          <BellButton />
        </View>

        <HomePulseCard data={dashboard} onPress={() => navigation.navigate('Dashboard')} />
        {(missingCompanyId || allocateError) && (
          <Text variant="caption" color="danger" style={styles.subtitle}>
            {missingCompanyId
              ? 'Missing company id — sign out and sign in again.'
              : `Courses failed to load: ${allocateError}`}
          </Text>
        )}

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
          <ScalePressable
            onPress={() => navigation.navigate('Courses')}
            haptic={false}
            style={styles.filterBtn}
          >
            <Ionicons name="options-outline" size={18} color={tokens.colors.primary} />
          </ScalePressable>
        </View>

        <View style={styles.shortcuts}>
          <Shortcut
            icon="clipboard-outline"
            label="Bookings"
            onPress={() => navigation.navigate('MyBookings')}
          />
          <Shortcut
            icon="document-text-outline"
            label="Coursework"
            onPress={() => navigation.navigate('Coursework')}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="title">My Courses</Text>
          <ScalePressable onPress={() => navigation.navigate('Courses')} haptic={false}>
            <Text variant="bodySmall" color="secondary" style={styles.link}>
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
        {filteredCourses.length === 0 ? (
          <EmptyState icon="book-outline" message="No courses match your search." />
        ) : null}

        <ScalePressable onPress={() => navigation.navigate('Calendar')} style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="calendar" size={22} color={tokens.colors.secondary} />
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

        {/* Upcoming Sessions — parked while home stays light; full stats live in Dashboard.
        <View style={styles.sectionHeader}>
          <Text variant="title">Upcoming Sessions</Text>
          <ScalePressable onPress={() => navigation.navigate('Calendar')} haptic={false}>
            <Text variant="bodySmall" color="secondary" style={styles.link}>
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
        {upcomingSessions.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            message="No upcoming sessions. Book a class to get started."
          />
        ) : null}
        */}
      </ScrollView>

      {pendingAnnouncement ? (
        <AnnouncementModal
          visible={showAnnouncementModal}
          announcement={pendingAnnouncement}
          onAcknowledge={() => acknowledgeAnnouncement.mutate(pendingAnnouncement.id)}
        />
      ) : null}
    </Screen>
  );
}

function Shortcut({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <ScalePressable onPress={onPress} hapticStyle="select" style={styles.shortcut}>
      <Ionicons name={icon} size={16} color={tokens.colors.secondary} />
      <Text variant="caption" style={styles.shortcutLabel}>
        {label}
      </Text>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    backgroundColor: tokens.colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: tokens.spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.sm,
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
    marginBottom: tokens.spacing.md,
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
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.secondaryMuted,
  },
  shortcutLabel: {
    fontFamily: tokens.fontFamily.semibold,
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
    backgroundColor: tokens.colors.tertiaryMuted,
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
    borderRadius: tokens.radius.xl,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  bannerCtaLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
