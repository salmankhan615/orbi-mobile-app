import { ScrollView, StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { useStaffGroups } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothScrollProps } from '@/utils/scroll';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Groups'>;

export function StaffGroupsScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const allowed = useHasPermission('view_groups');
  const { data, isLoading } = useStaffGroups();
  const groups = data ?? [];

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        {...smoothScrollProps}
      >
        <PageHeader title="Groups" subtitle="Cohorts, sessions, and students." />
        {!allowed ? (
          <Text variant="body" color="textMuted">
            You do not have permission to view groups.
          </Text>
        ) : isLoading ? (
          <EntityListSkeleton />
        ) : groups.length === 0 ? (
          <EmptyState icon="people-outline" message="No groups yet." />
        ) : (
          groups.map((group) => (
            <EntityRow
              key={group.id}
              icon="people-outline"
              title={group.name}
              subtitle={group.courseTitle}
              meta={`${group.studentCount} students · next ${group.nextSession}`}
              onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  content: {},
});
