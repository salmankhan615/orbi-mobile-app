import { FlatList, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { useStaffGroups } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import type { MainTabScreenProps } from '@/navigation/types';
import { tokens } from '@/theme';

type Props = MainTabScreenProps<'Groups'>;

export function StaffGroupsScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const allowed = useHasPermission('view_groups');
  const { data, isLoading } = useStaffGroups();
  const groups = data ?? [];

  return (
    <Screen style={styles.screen}>
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
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={{ paddingBottom: tabPadding }}
          renderItem={({ item: group }) => (
            <EntityRow
              icon="people-outline"
              title={group.name}
              subtitle={group.courseTitle}
              meta={`${group.studentCount} students · next ${group.nextSession}`}
              onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
            />
          )}
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
});
