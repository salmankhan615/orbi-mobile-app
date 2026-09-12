import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { Text } from '@/components/ui/Text';
import { useStaffCoursework } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { CourseworkItem } from '@/api/staff';
import type { RootStackScreenProps } from '@/navigation/types';
import { tokens } from '@/theme';

type Props = RootStackScreenProps<'StaffCoursework'>;

type StatusFilter = 'all' | CourseworkItem['status'];

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'graded', label: 'Graded' },
];

export function StaffCourseworkScreen({ navigation }: Props) {
  const allowed = useHasPermission('view_coursework');
  const canSubs = useHasPermission('view_submissions');
  const { data, isLoading } = useStaffCoursework();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const items = data ?? [];
  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.status === filter)),
    [items, filter],
  );

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
    <StackScreen title="Coursework" scroll={false}>
      <View style={styles.filters}>
        {FILTERS.map((item) => {
          const active = filter === item.key;
          const count =
            item.key === 'all' ? items.length : items.filter((row) => row.status === item.key).length;
          return (
            <ScalePressable
              key={item.key}
              haptic={false}
              onPress={() => setFilter(item.key)}
              style={active ? styles.chipActive : styles.chip}
            >
              <Text variant="caption" color={active ? 'onSecondary' : 'textSecondary'}>
                {item.label}
                {isLoading ? '' : ` · ${count}`}
              </Text>
            </ScalePressable>
          );
        })}
      </View>

      {isLoading ? (
        <EntityListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          message={
            filter === 'all'
              ? 'No coursework assignments yet.'
              : `No ${filter} coursework right now.`
          }
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <EntityRow
              icon="document-text-outline"
              title={item.title}
              subtitle={item.courseTitle}
              meta={`Due ${item.dueDate}`}
              badge={{
                label: item.status,
                tone:
                  item.status === 'graded'
                    ? 'success'
                    : item.status === 'submitted'
                      ? 'warning'
                      : 'primary',
              }}
              onPress={
                canSubs
                  ? () => navigation.navigate('CourseworkSubmissions', { assignmentId: item.id })
                  : undefined
              }
            />
          )}
        />
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
  chipActive: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.secondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.secondary,
  },
  list: {
    paddingBottom: tokens.spacing.xl,
  },
});
