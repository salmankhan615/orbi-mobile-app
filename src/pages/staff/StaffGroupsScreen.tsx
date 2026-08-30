import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { PageHeader } from '@/components/ui/PageHeader';
import { EntityRow } from '@/components/custom/EntityRow';
import { useStaffGroups } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Groups'>;

export function StaffGroupsScreen({ navigation }: Props) {
  const allowed = useHasPermission('view_groups');
  const { data } = useStaffGroups();

  return (
    <Screen style={styles.screen}>
      <PageHeader title="Groups" subtitle="Cohorts, sessions, and students." />
      {!allowed ? (
        <Text variant="body" color="textMuted">
          You do not have permission to view groups.
        </Text>
      ) : (
        (data ?? []).map((group) => (
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
});
