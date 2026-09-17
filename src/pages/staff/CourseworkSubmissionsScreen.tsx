import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { Text } from '@/components/ui/Text';
import { SubmissionGradeCard } from '@/features/coursework/components/SubmissionGradeCard';
import {
  useAddCourseworkFeedback,
  useGradeCourseworkSubmission,
  useStaffCoursework,
  useSubmissions,
} from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import type { CourseworkFile, CourseworkSubmission } from '@/api/staff';
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
  const assignmentId = route.params.assignmentId;
  const allowed = useHasPermission('view_submissions');
  const { data, isLoading } = useSubmissions(assignmentId);
  const { data: coursework } = useStaffCoursework();
  const grade = useGradeCourseworkSubmission(assignmentId);
  const feedback = useAddCourseworkFeedback(assignmentId);
  const showToast = useToastStore((state) => state.show);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [savingScoreId, setSavingScoreId] = useState<string | null>(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const assignment = data?.assignment ?? coursework?.find((item) => item.id === assignmentId);
  const maxScore = assignment?.maxScore;
  const visible = useMemo(
    () => (filter === 'all' ? rows : rows.filter((item) => item.status === filter)),
    [rows, filter],
  );

  function openFile(file: CourseworkFile) {
    navigation.navigate('CourseworkFile', {
      url: file.url,
      filename: file.filename,
      type: file.type,
    });
  }

  function saveScore(submissionId: string, score: number | null) {
    if (score != null && maxScore != null && score > maxScore) {
      showToast(`Score cannot be more than ${maxScore}`, 'danger');
      return;
    }
    setSavingScoreId(submissionId);
    grade.mutate(
      { submissionId, score },
      {
        onSuccess: () => {
          haptics.success();
          showToast('Score saved', 'success');
        },
        onError: (error) => {
          haptics.warning();
          showToast(error instanceof Error ? error.message : 'Could not save score', 'danger');
        },
        onSettled: () => setSavingScoreId(null),
      },
    );
  }

  function saveFeedback(submissionId: string, text: string) {
    setSavingFeedbackId(submissionId);
    feedback.mutate(
      { submissionId, text },
      {
        onSuccess: () => {
          haptics.success();
          showToast('Feedback saved', 'success');
        },
        onError: (error) => {
          haptics.warning();
          showToast(error instanceof Error ? error.message : 'Could not save feedback', 'danger');
        },
        onSettled: () => setSavingFeedbackId(null),
      },
    );
  }

  if (!allowed) {
    return (
      <StackScreen title="Submissions">
        <Text variant="body" color="textMuted">
          You do not have permission to view submissions.
        </Text>
      </StackScreen>
    );
  }

  const submittedLabel =
    assignment?.studentCount != null
      ? `${rows.length}/${assignment.studentCount} submitted`
      : `${rows.length} submitted`;

  return (
    <StackScreen title="Submissions" scroll={false}>
      {assignment ? (
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text variant="title" style={styles.headerTitle}>
              {assignment.title}
            </Text>
            <View style={styles.countPill}>
              <Text variant="caption" color="onPrimary">
                {submittedLabel}
              </Text>
            </View>
          </View>
          <Text variant="caption" color="textSecondary">
            Due {assignment.dueDate}
            {maxScore != null ? ` · Max ${maxScore}` : ''}
          </Text>
          {assignment.instructions ? (
            <Text variant="caption" color="textMuted" style={styles.instructions}>
              {assignment.instructions}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.filters}>
        {FILTERS.map((item) => {
          const active = filter === item.key;
          const count =
            item.key === 'all' ? rows.length : rows.filter((row) => row.status === item.key).length;
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
          initialNumToRender={8}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <SubmissionGradeCard
              item={item}
              index={index + 1}
              maxScore={maxScore}
              savingScore={savingScoreId === item.id}
              savingFeedback={savingFeedbackId === item.id}
              onOpenFile={openFile}
              onOpenStudent={() =>
                navigation.navigate('CourseworkSubmissionDetail', {
                  assignmentId,
                  submissionId: item.id,
                  studentName: item.studentName,
                  submittedAt: item.submittedAt,
                  status: item.status,
                  grade: item.grade,
                  files: item.files,
                  comments: item.comments,
                })
              }
              onSaveScore={(score) => saveScore(item.id, score)}
              onSaveFeedback={(text) => saveFeedback(item.id, text)}
            />
          )}
        />
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  countPill: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
  },
  instructions: {
    marginTop: tokens.spacing.xs,
  },
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
    gap: tokens.spacing.md,
  },
});
