import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { Text } from '@/components/ui/Text';
import { useDirectory } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';

export function UserDirectoryScreen() {
  const allowed = useHasPermission('view_users');
  const { data, isLoading } = useDirectory();

  if (!allowed) {
    return (
      <StackScreen title="Directory">
        <Text variant="body" color="textMuted">
          You do not have permission to view users.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Users directory">
      {isLoading ? (
        <EntityListSkeleton />
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon="people-outline" message="No users found." />
      ) : (
        (data ?? []).map((user) => (
          <EntityRow
            key={user.id}
            icon={user.role === 'staff' ? 'briefcase-outline' : 'person-outline'}
            title={user.name}
            subtitle={user.email}
            badge={{ label: user.status, tone: user.status === 'active' ? 'success' : 'warning' }}
          />
        ))
      )}
    </StackScreen>
  );
}
