import { Text } from '@/components/ui/Text';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { useStaffGroups, useGroupStudents } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'GroupDetail'>;

export function GroupDetailScreen({ route }: Props) {
  const canSessions = useHasPermission('view_group_sessions');
  const { data: groups } = useStaffGroups();
  const group = groups?.find((item) => item.id === route.params.groupId);
  const { data: students } = useGroupStudents(route.params.groupId);

  return (
    <StackScreen title={group?.name ?? 'Group'}>
      <Text variant="bodySmall" color="textSecondary">
        {group?.courseTitle}
      </Text>
      {canSessions ? (
        <Text variant="caption" color="textMuted">
          Next session {group?.nextSession}
        </Text>
      ) : (
        <Text variant="caption" color="textMuted">
          Session details are hidden for your role.
        </Text>
      )}
      {(students ?? []).length === 0 ? (
        <EmptyState icon="person-outline" message="No students in this group yet." />
      ) : (
        (students ?? []).map((student) => (
          <EntityRow
            key={student.id}
            icon="person-outline"
            title={student.name}
            subtitle={student.email}
            badge={{ label: `${student.progress}%`, tone: 'primary' }}
          />
        ))
      )}
    </StackScreen>
  );
}
