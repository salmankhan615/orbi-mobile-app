import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FilterSelectRow } from '@/features/bookings/components/BookingFilters';
import {
  DEFAULT_GROUP_FILTERS,
  GROUP_STATUS_TABS,
  filterStaffGroups,
  statusBadgeTone,
  type GroupEndedFilter,
  type GroupListFilters,
  type GroupStatusTab,
} from '@/features/staff/groupFilters';
import { useCrmCourseOptions, useGroupStaffOptions, useStaffGroups } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { formatPortalDate } from '@/utils/date';
import type { MainTabScreenProps } from '@/navigation/types';
import { tokens } from '@/theme';

type Props = MainTabScreenProps<'Groups'>;

export function StaffGroupsScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const allowed = useHasPermission('view_groups');
  const { data, isLoading } = useStaffGroups();
  const { data: courses } = useCrmCourseOptions(allowed);
  const { data: staffOptions } = useGroupStaffOptions(allowed);
  const [filters, setFilters] = useState<GroupListFilters>(DEFAULT_GROUP_FILTERS);

  const groups = useMemo(() => filterStaffGroups(data ?? [], filters), [data, filters]);

  const courseFilterOptions = useMemo(
    () => [
      { id: '', label: 'All courses' },
      ...(courses ?? []).map((course) => ({ id: course.id, label: course.title })),
    ],
    [courses],
  );

  const staffFilterOptions = useMemo(
    () => [
      { id: '', label: 'All staff' },
      ...(staffOptions ?? []).map((member) => ({ id: member.id, label: member.name })),
    ],
    [staffOptions],
  );

  const endedFilterOptions = [
    { id: '', label: 'All' },
    { id: 'active', label: 'Active (not ended)' },
    { id: 'ended', label: 'Ended' },
  ];

  function patchFilters(patch: Partial<GroupListFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <Screen style={styles.screen}>
      <PageHeader title="Groups" subtitle="Cohorts, sessions, and students." />
      {!allowed ? (
        <Text variant="body" color="textMuted">
          You do not have permission to view groups.
        </Text>
      ) : isLoading ? (
        <EntityListSkeleton />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={{ paddingBottom: tabPadding }}
          ListHeaderComponent={
            <View style={styles.filters}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusTabs}
              >
                {GROUP_STATUS_TABS.map((tab) => {
                  const active = filters.status === tab.key;
                  return (
                    <ScalePressable
                      key={tab.key}
                      haptic={false}
                      hapticStyle="select"
                      onPress={() => patchFilters({ status: tab.key as GroupStatusTab })}
                      style={[styles.statusChip, active && styles.statusChipActive]}
                    >
                      <Text
                        variant="caption"
                        color={active ? 'secondary' : 'textSecondary'}
                        style={styles.statusLabel}
                      >
                        {tab.label}
                      </Text>
                    </ScalePressable>
                  );
                })}
              </ScrollView>
              <FilterSelectRow
                label="Course"
                value={filters.courseId}
                options={courseFilterOptions}
                onChange={(courseId) => patchFilters({ courseId })}
              />
              <FilterSelectRow
                label="Staff"
                value={filters.staffId}
                options={staffFilterOptions}
                onChange={(staffId) => patchFilters({ staffId })}
              />
              <FilterSelectRow
                label="Schedule"
                value={filters.ended}
                options={endedFilterOptions}
                onChange={(ended) => patchFilters({ ended: ended as GroupEndedFilter })}
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState icon="people-outline" message="No groups match these filters." />
          }
          renderItem={({ item: group }) => {
            const staffNames = group.staff.map((member) => member.name).filter(Boolean);
            const schedule =
              group.startDate || group.endDate
                ? `${formatPortalDate(group.startDate)} → ${formatPortalDate(group.endDate)}`
                : undefined;
            return (
              <ScalePressable
                onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <Text variant="bodySmall" style={styles.cardTitle} numberOfLines={2}>
                    {group.name}
                  </Text>
                  <Badge label={group.status} tone={statusBadgeTone(group.status)} />
                </View>
                {group.description && group.description !== group.name ? (
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {group.description}
                  </Text>
                ) : null}
                <Text variant="caption" color="textSecondary" numberOfLines={1}>
                  {group.courseTitle}
                </Text>
                {group.days.length > 0 ? (
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {group.days.join(', ')}
                  </Text>
                ) : null}
                {staffNames.length > 0 ? (
                  <Text variant="caption" color="textSecondary" numberOfLines={1}>
                    Staff · {staffNames.join(', ')}
                  </Text>
                ) : null}
                {schedule ? (
                  <Text variant="caption" color="textMuted">
                    {schedule}
                    {group.ended ? ' · Ended' : ''}
                  </Text>
                ) : null}
              </ScalePressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  filters: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  statusTabs: {
    gap: tokens.spacing.sm,
    paddingBottom: tokens.spacing.xs,
  },
  statusChip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  statusChipActive: {
    borderColor: tokens.colors.secondary,
    backgroundColor: tokens.colors.secondaryMuted,
  },
  statusLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontFamily: tokens.fontFamily.medium,
  },
});
