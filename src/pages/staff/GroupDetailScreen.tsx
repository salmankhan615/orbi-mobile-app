import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { PermissionGate } from '@/components/custom/PermissionGate';
import { Spinner } from '@/components/ui/Spinner';
import {
  useStaffGroups,
  useGroupStudents,
  useGroupSessions,
} from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'GroupDetail'>;

export function GroupDetailScreen({ route }: Props) {
  const canSessions = useHasPermission('view_group_sessions');
  const { data: groups, isLoading: groupsLoading } = useStaffGroups();
  const group = groups?.find((item) => item.id === route.params.groupId);
  const { data: students, isLoading: studentsLoading } = useGroupStudents(route.params.groupId);
  const { data: sessions, isLoading: sessionsLoading } = useGroupSessions(route.params.groupId);

  return (
    <StackScreen title={group?.name ?? 'Group'}>
      <PermissionGate permission="view_groups" message="You cannot view this group.">
        <Text variant="bodySmall" color="textSecondary" style={styles.course}>
          {group?.courseTitle}
        </Text>
        <Text variant="caption" color="textMuted" style={styles.meta}>
          {group?.studentCount ?? 0} students
          {group?.nextSession ? ` · next ${group.nextSession}` : ''}
        </Text>

        {groupsLoading && !group ? <Spinner fill label="Loading group…" /> : null}

        <Text variant="title" style={styles.section}>
          Sessions
        </Text>
        {!canSessions ? (
          <Text variant="bodySmall" color="textMuted" style={styles.denied}>
            Session details are hidden for your role.
          </Text>
        ) : sessionsLoading ? (
          <EntityListSkeleton rows={2} />
        ) : (sessions ?? []).length === 0 ? (
          <EmptyState icon="calendar-outline" message="No sessions scheduled for this group." />
        ) : (
          (sessions ?? []).map((session) => (
            <EntityRow
              key={session.id}
              icon="calendar-outline"
              title={session.title}
              subtitle={`${session.date} · ${session.startTime}–${session.endTime}`}
              meta={session.location}
            />
          ))
        )}

        <Text variant="title" style={styles.section}>
          Students
        </Text>
        {studentsLoading ? (
          <EntityListSkeleton rows={3} />
        ) : (students ?? []).length === 0 ? (
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
      </PermissionGate>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  course: {
    marginBottom: tokens.spacing.xs,
  },
  meta: {
    marginBottom: tokens.spacing.xl,
  },
  section: {
    marginBottom: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
  denied: {
    marginBottom: tokens.spacing.lg,
  },
});
