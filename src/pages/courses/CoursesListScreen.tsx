import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/custom/Screen';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { useCourses } from '@/queries/useCourses';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothListProps } from '@/utils/scroll';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { CourseListSkeleton } from '@/components/custom/Skeletons';
import type { Course, CourseStatus } from '@/api/courses';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Courses'>;
type FilterTab = 'all' | CourseStatus;

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'completed', label: 'Completed' },
];

export function CoursesListScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const { data: courses, isLoading, allocateError, missingCompanyId } = useCourses();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo<Course[]>(() => {
    if (!courses) return [];
    const byStatus =
      activeFilter === 'all' ? courses : courses.filter((course) => course.status === activeFilter);
    if (!query.trim()) return byStatus;
    const needle = query.trim().toLowerCase();
    return byStatus.filter((course) => course.title.toLowerCase().includes(needle));
  }, [courses, activeFilter, query]);

  return (
    <Screen style={styles.screen}>
      <FlatList
        style={styles.listFlex}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabPadding }]}
        {...smoothListProps}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <IconButton
                name="menu"
                background="surfaceAlt"
                onPress={() => navigation.navigate('Profile')}
              />
              <Text variant="heading">My Courses</Text>
              <IconButton
                name="notifications-outline"
                background="surfaceAlt"
                onPress={() => navigation.navigate('Notifications')}
              />
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
                clearButtonMode="while-editing"
              />
              {query.length > 0 && (
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={tokens.colors.textMuted}
                  onPress={() => setQuery('')}
                  suppressHighlighting
                />
              )}
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((item) => {
                const isActive = item.key === activeFilter;
                return (
                  <ScalePressable
                    key={item.key}
                    onPress={() => setActiveFilter(item.key)}
                    hapticStyle="select"
                  >
                    <View style={[styles.filterChip, isActive && styles.filterChipActive]}>
                      <Text
                        variant="caption"
                        color={isActive ? 'onSecondary' : 'textSecondary'}
                        style={styles.filterChipLabel}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <CourseListSkeleton />
          ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="book-outline" size={28} color={tokens.colors.textMuted} />
            </View>
            <Text variant="bodySmall" color="textMuted">
              {missingCompanyId
                ? 'Missing company id — sign out and sign in again.'
                : allocateError
                  ? allocateError
                  : 'No courses match your filters'}
            </Text>
          </View>
          )
        }
        renderItem={({ item, index }) => (
          <CourseCard
            course={item}
            index={index}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  listFlex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.md,
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  filterChip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
  filterChipActive: {
    backgroundColor: tokens.colors.secondary,
    borderColor: tokens.colors.secondary,
  },
  filterChipLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  list: {},
  empty: {
    alignItems: 'center',
    paddingTop: tokens.spacing.xxxl,
    gap: tokens.spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
