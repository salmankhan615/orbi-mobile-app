import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { Text } from '@/components/ui/Text';
import { useStaffCoursework } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'StaffCoursework'>;

export function StaffCourseworkScreen({ navigation }: Props) {
  const allowed = useHasPermission('view_coursework');
  const canSubs = useHasPermission('view_submissions');
  const { data } = useStaffCoursework();

  if (!allowed) {
    return (
      <StackScreen title="Coursework">
        <Text variant="body" color="textMuted">
          You do not have permission to view coursework.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Coursework">
      {(data ?? []).length === 0 ? (
        <EmptyState icon="document-text-outline" message="No coursework assignments yet." />
      ) : (
        (data ?? []).map((item) => (
          <EntityRow
            key={item.id}
            icon="document-text-outline"
            title={item.title}
            subtitle={item.courseTitle}
            meta={`Due ${item.dueDate}`}
            badge={{ label: item.status, tone: 'primary' }}
            onPress={
              canSubs
                ? () => navigation.navigate('CourseworkSubmissions', { assignmentId: item.id })
                : undefined
            }
          />
        ))
      )}
    </StackScreen>
  );
}
