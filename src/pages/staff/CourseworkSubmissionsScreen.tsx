import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { Text } from '@/components/ui/Text';
import { useSubmissions } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'CourseworkSubmissions'>;

export function CourseworkSubmissionsScreen({ route }: Props) {
  const allowed = useHasPermission('view_submissions');
  const { data } = useSubmissions(route.params.assignmentId);

  if (!allowed) {
    return (
      <StackScreen title="Submissions">
        <Text variant="body" color="textMuted">
          You do not have permission to view submissions.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Submissions">
      {(data ?? []).length === 0 ? (
        <EmptyState icon="cloud-upload-outline" message="No submissions yet." />
      ) : (
        (data ?? []).map((item) => (
          <EntityRow
            key={item.id}
            icon="cloud-upload-outline"
            title={item.studentName}
            subtitle={`Submitted ${item.submittedAt}`}
            badge={{
              label: item.grade ?? item.status,
              tone: item.status === 'graded' ? 'success' : 'warning',
            }}
          />
        ))
      )}
    </StackScreen>
  );
}
