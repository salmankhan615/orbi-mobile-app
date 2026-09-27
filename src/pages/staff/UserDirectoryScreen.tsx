import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { Text } from '@/components/ui/Text';
import { useDirectory } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { DirectoryUser } from '@/api/staff';
import { tokens } from '@/theme';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'UserDirectory'>;

const FILTERS: { key: DirectoryUser['role']; label: string }[] = [
  { key: 'student', label: 'Students' },
  { key: 'staff', label: 'Staff' },
];

export function UserDirectoryScreen({ navigation }: Props) {
  const allowed = useHasPermission('view_users');
  const { data, isLoading } = useDirectory();
  const [filter, setFilter] = useState<DirectoryUser['role']>('student');
  const [search, setSearch] = useState('');
  const users = data ?? [];

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (user.role !== filter) return false;
      if (!q) return true;
      return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
    });
  }, [users, filter, search]);

  const studentCount = users.filter((user) => user.role === 'student').length;
  const staffCount = users.filter((user) => user.role === 'staff').length;

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
        onChangeText={setSearch}
        placeholder="Search name or email"
        placeholderTextColor={tokens.colors.textMuted}
        style={styles.search}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.tabs}>
        {FILTERS.map((item) => {
          const count = item.key === 'student' ? studentCount : staffCount;
          const active = filter === item.key;
          return (
            <ScalePressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              hapticStyle="select"
              style={styles.tabPress}
            >
              <View style={[styles.tab, active && styles.tabActive]}>
                <Text
                  variant="caption"
                  color={active ? 'secondary' : 'textSecondary'}
                  style={styles.tabLabel}
                >
                  {item.label}
                  {isLoading ? '' : ` · ${count}`}
                </Text>
              </View>
            </ScalePressable>
          );
        })}
      </View>

      {isLoading ? (
        <EntityListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState icon="people-outline" message="No users found." />
      ) : (
        <FlatList
          data={visible}
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
              badge={{
                label: user.role === 'staff' ? 'Staff' : 'Student',
                tone: user.role === 'staff' ? 'primary' : 'info',
              }}
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
  tabs: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  tabPress: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
  tabActive: {
    backgroundColor: tokens.colors.secondaryMuted,
    borderColor: tokens.colors.secondary,
  },
  tabLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  list: {
    paddingBottom: tokens.spacing.xl,
  },
});
