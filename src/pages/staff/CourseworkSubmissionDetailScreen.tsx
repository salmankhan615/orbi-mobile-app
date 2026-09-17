import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { CourseworkFileChip } from '@/features/coursework/components/CourseworkFileChip';
import {
  useAddCourseworkFeedback,
  useGradeCourseworkSubmission,
  useStaffCoursework,
} from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
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
  const { data: coursework } = useStaffCoursework();
  const assignment = coursework?.find((item) => item.id === assignmentId);
  const maxScore = assignment?.maxScore;
  const [score, setScore] = useState(grade ?? '');
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState(comments);
  const showToast = useToastStore((state) => state.show);
  const gradeMutation = useGradeCourseworkSubmission(assignmentId);
  const feedbackMutation = useAddCourseworkFeedback(assignmentId);

  function openFile(file: CourseworkFile) {
    navigation.navigate('CourseworkFile', {
      url: file.url,
      filename: file.filename,
      type: file.type,
    });
  }

  function saveGrade() {
    const trimmed = score.trim();
    const value = trimmed ? Number(trimmed) : null;
    if (trimmed && !Number.isFinite(value)) {
      showToast('Enter a valid score', 'danger');
      return;
    }
    if (value != null && maxScore != null && value > maxScore) {
      showToast(`Score cannot be more than ${maxScore}`, 'danger');
      return;
    }
    gradeMutation.mutate(
      { submissionId, score: value },
      {
        onSuccess: () => {
          haptics.success();
          showToast('Grade saved', 'success');
        },
        onError: (error) => {
          haptics.warning();
          showToast(error instanceof Error ? error.message : 'Could not save grade', 'danger');
        },
      },
    );
  }

  function saveFeedback() {
    const text = feedback.trim();
    if (!text) {
      showToast('Enter feedback first', 'danger');
      return;
    }
    feedbackMutation.mutate(
      { submissionId, text },
      {
        onSuccess: () => {
          haptics.success();
          showToast('Feedback saved', 'success');
          setNotes((prev) => [...prev, { id: `local-${Date.now()}`, text }]);
          setFeedback('');
        },
        onError: (error) => {
          haptics.warning();
          showToast(error instanceof Error ? error.message : 'Could not save feedback', 'danger');
        },
      },
    );
  }

  return (
    <StackScreen title="Submission" keyboardAvoiding>
      <Text variant="heading">{studentName}</Text>
      <View style={styles.badge}>
        <Badge
          label={status}
          tone={status === 'graded' ? 'success' : status === 'late' ? 'danger' : 'warning'}
        />
      </View>
      <Text variant="bodySmall" color="textSecondary" style={styles.meta}>
        Submitted {submittedAt}
        {maxScore != null ? ` · Max ${maxScore}` : ''}
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

      <Text variant="title" style={styles.section}>
        Feedback
      </Text>
      {notes.length > 0 ? (
        notes.map((comment: CourseworkFeedback) => (
          <View key={comment.id} style={styles.comment}>
            <Text variant="bodySmall" color="textSecondary">
              {comment.text}
            </Text>
          </View>
        ))
      ) : (
        <Text variant="bodySmall" color="textMuted" style={styles.emptyFiles}>
          No feedback yet.
        </Text>
      )}

      {canGrade ? (
        <>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Write feedback for this student…"
            placeholderTextColor={tokens.colors.textMuted}
            multiline
            textAlignVertical="top"
            style={styles.feedbackInput}
          />
          <Button
            label="Save feedback"
            variant="secondary"
            loading={feedbackMutation.isPending}
            disabled={!feedback.trim() || feedbackMutation.isPending}
            onPress={saveFeedback}
            style={styles.save}
          />

          <Text variant="title" style={styles.section}>
            Grade
          </Text>
          <TextField
            label={maxScore != null ? `Score / ${maxScore}` : 'Score'}
            value={score}
            onChangeText={setScore}
            keyboardType="decimal-pad"
            placeholder="Enter score"
          />
          <Button
            label="Save grade"
            loading={gradeMutation.isPending}
            onPress={saveGrade}
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
  feedbackInput: {
    minHeight: 110,
    marginBottom: tokens.spacing.md,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fontFamily.regular,
    fontSize: tokens.fontSize.md,
  },
  save: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
});
