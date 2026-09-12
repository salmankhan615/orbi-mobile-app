import { FlatList, StyleSheet } from 'react-native';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { Text } from '@/components/ui/Text';
import { useDirectory } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { tokens } from '@/theme';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'UserDirectory'>;

export function UserDirectoryScreen({ navigation }: Props) {
  const allowed = useHasPermission('view_users');
  const { data, isLoading } = useDirectory();
  const users = data ?? [];

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
    <StackScreen title="Users directory" scroll={false}>
      {isLoading ? (
        <EntityListSkeleton />
      ) : users.length === 0 ? (
        <EmptyState icon="people-outline" message="No users found." />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={styles.list}
          renderItem={({ item: user }) => (
            <EntityRow
              icon={user.role === 'staff' ? 'briefcase-outline' : 'person-outline'}
              title={user.name}
              subtitle={user.email}
              badge={{ label: user.status, tone: user.status === 'active' ? 'success' : 'warning' }}
              onPress={() =>
                navigation.navigate('UserDetail', {
                  userId: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  status: user.status,
                })
              }
            />
          )}
        />
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: tokens.spacing.xl,
  },
});
