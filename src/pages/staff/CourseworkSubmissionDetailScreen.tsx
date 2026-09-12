import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { CourseworkFileChip } from '@/features/coursework/components/CourseworkFileChip';
import { gradeCourseworkSubmission } from '@/api/crm';
import { staffKeys } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import type { CourseworkFeedback, CourseworkFile } from '@/api/staff';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'CourseworkSubmissionDetail'>;

export function CourseworkSubmissionDetailScreen({ route, navigation }: Props) {
  const {
    assignmentId,
    submissionId,
    studentName,
    submittedAt,
    status,
    grade,
    files = [],
    comments = [],
  } = route.params;
  const canGrade = useHasPermission('view_submissions');
  const [score, setScore] = useState(grade ?? '');
  const showToast = useToastStore((state) => state.show);
  const client = useQueryClient();

  const gradeMutation = useMutation({
    mutationFn: () =>
      gradeCourseworkSubmission(assignmentId, submissionId, {
        score: score.trim() ? Number(score) : null,
        status: 'graded',
      }),
    onSuccess: () => {
      showToast('Grade saved', 'success');
      client.invalidateQueries({ queryKey: staffKeys.submissions(assignmentId) });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Could not save grade', 'danger');
    },
  });

  function openFile(file: CourseworkFile) {
    navigation.navigate('CourseworkFile', {
      url: file.url,
      filename: file.filename,
      type: file.type,
    });
  }

  return (
    <StackScreen title="Submission">
      <Text variant="heading">{studentName}</Text>
      <View style={styles.badge}>
        <Badge
          label={status}
          tone={status === 'graded' ? 'success' : status === 'late' ? 'danger' : 'warning'}
        />
      </View>
      <Text variant="bodySmall" color="textSecondary" style={styles.meta}>
        Submitted {submittedAt}
      </Text>

      <Text variant="title" style={styles.section}>
        Submitted files
      </Text>
      {files.length === 0 ? (
        <Text variant="bodySmall" color="textMuted" style={styles.emptyFiles}>
          No files attached to this submission.
        </Text>
      ) : (
        <View style={styles.files}>
          {files.map((file) => (
            <CourseworkFileChip
              key={`${file.url}-${file.filename}`}
              file={file}
              onPress={() => openFile(file)}
            />
          ))}
        </View>
      )}

      {comments.length > 0 ? (
        <>
          <Text variant="title" style={styles.section}>
            Comments
          </Text>
          {comments.map((comment: CourseworkFeedback) => (
            <View key={comment.id} style={styles.comment}>
              <Text variant="bodySmall" color="textSecondary">
                {comment.text}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      {canGrade ? (
        <>
          <Text variant="title" style={styles.section}>
            Grade
          </Text>
          <TextField
            label="Score"
            value={score}
            onChangeText={setScore}
            keyboardType="decimal-pad"
            placeholder="Enter score"
          />
          <Button
            label="Save grade"
            loading={gradeMutation.isPending}
            onPress={() => gradeMutation.mutate()}
            style={styles.save}
          />
        </>
      ) : null}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  meta: {
    marginBottom: tokens.spacing.lg,
  },
  section: {
    marginBottom: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
  emptyFiles: {
    marginBottom: tokens.spacing.lg,
  },
  files: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  comment: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
  },
  save: {
    marginTop: tokens.spacing.lg,
  },
});
