import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { trackRoute } from '@/api/screenTracking';
import { useDirectory } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { tokens } from '@/theme';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'UserDirectory'>;

/** Rows per page — matches portal directory paging. */
const PAGE_SIZE = 20;

export function UserDirectoryScreen({ navigation }: Props) {
  const allowed = useHasPermission('view_users');
  const { data, isLoading } = useDirectory();
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const users = data ?? [];

  // Students only — Staff tab is hidden from the directory.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (user.role !== 'student') return false;
      if (!q) return true;
      return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
    });
  }, [users, search]);

  const page = visible.slice(0, visibleCount);
  const hasMore = visibleCount < visible.length;

  function handleSearchChange(value: string) {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }

  function loadMore() {
    if (!hasMore) return;
    setVisibleCount((count) => count + PAGE_SIZE);
  }

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
      <TextInput
        value={search}
        onChangeText={handleSearchChange}
        placeholder="Search name or email"
        placeholderTextColor={tokens.colors.textMuted}
        style={styles.search}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {isLoading ? (
        <EntityListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState icon="people-outline" message="No users found." />
      ) : (
        <FlatList
          data={page}
          keyExtractor={(item) => item.id}
          initialNumToRender={PAGE_SIZE}
          maxToRenderPerBatch={PAGE_SIZE}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text variant="caption" color="textMuted" style={styles.pageInfo}>
                Showing {page.length} of {visible.length}
              </Text>
              {hasMore ? (
                <Button label="Load more" variant="outline" onPress={loadMore} />
              ) : null}
            </View>
          }
          renderItem={({ item: user }) => (
            <EntityRow
              icon={user.role === 'staff' ? 'briefcase-outline' : 'person-outline'}
              title={user.name}
              subtitle={user.email}
              badge={{
                label: user.role === 'staff' ? 'Staff' : 'Student',
                tone: user.role === 'staff' ? 'primary' : 'info',
              }}
              onPress={() => {
                const params = {
                  userId: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  status: user.status,
                };
                trackRoute('UserDetail', params);
                navigation.navigate('UserDetail', params);
              }}
            />
          )}
        />
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  search: {
    marginBottom: tokens.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fontFamily.regular,
    fontSize: tokens.fontSize.sm,
  },
  list: {
    paddingBottom: tokens.spacing.xl,
  },
  footer: {
    gap: tokens.spacing.sm,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.lg,
  },
  pageInfo: {
    textAlign: 'center',
  },
});
