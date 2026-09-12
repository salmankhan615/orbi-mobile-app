import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { Text } from '@/components/ui/Text';
import { useSubmissions } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { CourseworkSubmission } from '@/api/staff';
import type { RootStackScreenProps } from '@/navigation/types';
import { tokens } from '@/theme';

type Props = RootStackScreenProps<'CourseworkSubmissions'>;

type StatusFilter = 'all' | CourseworkSubmission['status'];

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'late', label: 'Late' },
  { key: 'graded', label: 'Graded' },
];

export function CourseworkSubmissionsScreen({ route, navigation }: Props) {
  const allowed = useHasPermission('view_submissions');
  const { data, isLoading } = useSubmissions(route.params.assignmentId);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const submissions = data ?? [];
  const visible = useMemo(
    () => (filter === 'all' ? submissions : submissions.filter((item) => item.status === filter)),
    [submissions, filter],
  );

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
    <StackScreen title="Submissions" scroll={false}>
      <View style={styles.filters}>
        {FILTERS.map((item) => {
          const active = filter === item.key;
          const count =
            item.key === 'all'
              ? submissions.length
              : submissions.filter((row) => row.status === item.key).length;
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
          icon="cloud-upload-outline"
          message={filter === 'all' ? 'No submissions yet.' : `No ${filter} submissions.`}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <EntityRow
              icon="cloud-upload-outline"
              title={item.studentName}
              subtitle={`Submitted ${item.submittedAt}${item.files?.length ? ` · ${item.files.length} file${item.files.length === 1 ? '' : 's'}` : ''}`}
              badge={{
                label: item.grade ?? item.status,
                tone: item.status === 'graded' ? 'success' : item.status === 'late' ? 'danger' : 'warning',
              }}
              onPress={() =>
                navigation.navigate('CourseworkSubmissionDetail', {
                  assignmentId: route.params.assignmentId,
                  submissionId: item.id,
                  studentName: item.studentName,
                  submittedAt: item.submittedAt,
                  status: item.status,
                  grade: item.grade,
                  files: item.files,
                  comments: item.comments,
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
