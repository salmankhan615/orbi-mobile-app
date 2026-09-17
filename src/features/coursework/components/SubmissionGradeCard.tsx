import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { CourseworkFileChip } from '@/features/coursework/components/CourseworkFileChip';
import type { CourseworkFile, CourseworkSubmission } from '@/api/staff';

interface SubmissionGradeCardProps {
  item: CourseworkSubmission;
  index: number;
  maxScore?: number;
  savingScore?: boolean;
  savingFeedback?: boolean;
  onOpenFile: (file: CourseworkFile) => void;
  onOpenStudent?: () => void;
  onSaveScore: (score: number | null) => void;
  onSaveFeedback: (text: string) => void;
}

export function SubmissionGradeCard({
  item,
  index,
  maxScore,
  savingScore,
  savingFeedback,
  onOpenFile,
  onOpenStudent,
  onSaveScore,
  onSaveFeedback,
}: SubmissionGradeCardProps) {
  const [score, setScore] = useState(item.grade ?? '');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const comments = item.comments ?? [];
  const files = item.files ?? [];

  function saveScore() {
    const trimmed = score.trim();
    if (!trimmed) {
      onSaveScore(null);
      return;
    }
    const value = Number(trimmed);
    if (!Number.isFinite(value)) return;
    onSaveScore(value);
  }

  function saveFeedback() {
    const text = feedback.trim();
    if (!text) return;
    onSaveFeedback(text);
    setFeedback('');
    setFeedbackOpen(false);
  }

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text variant="caption" color="textMuted" style={styles.index}>
          #{index}
        </Text>
        <Badge
          label={item.status}
          tone={
            item.status === 'graded' ? 'success' : item.status === 'late' ? 'danger' : 'primary'
          }
        />
      </View>

      {onOpenStudent ? (
        <ScalePressable onPress={onOpenStudent}>
          <Text variant="bodySmall" style={styles.name}>
            {item.studentName}
          </Text>
        </ScalePressable>
      ) : (
        <Text variant="bodySmall" style={styles.name}>
          {item.studentName}
        </Text>
      )}
      <Text variant="caption" color="textMuted">
        Submitted {item.submittedAt}
      </Text>

      {files.length > 0 ? (
        <View style={styles.files}>
          {files.map((file) => (
            <CourseworkFileChip
              key={`${file.url}-${file.filename}`}
              file={file}
              onPress={() => onOpenFile(file)}
            />
          ))}
        </View>
      ) : (
        <Text variant="caption" color="textMuted" style={styles.empty}>
          No files
        </Text>
      )}

      <View style={styles.scoreRow}>
        <Text variant="caption" color="textSecondary" style={styles.scoreLabel}>
          Score
        </Text>
        <TextInput
          value={score}
          onChangeText={setScore}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={tokens.colors.textMuted}
          style={styles.scoreInput}
        />
        <Text variant="bodySmall" color="textSecondary">
          /{maxScore ?? '—'}
        </Text>
        <ScalePressable onPress={saveScore} disabled={savingScore} style={styles.checkBtn}>
          <Ionicons
            name="checkmark-circle"
            size={28}
            color={savingScore ? tokens.colors.textMuted : tokens.colors.success}
          />
        </ScalePressable>
      </View>

      {comments.length > 0 ? (
        <View style={styles.comments}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Text variant="caption" color="textSecondary">
                {comment.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {feedbackOpen ? (
        <View style={styles.feedbackBox}>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Write feedback for this student…"
            placeholderTextColor={tokens.colors.textMuted}
            multiline
            textAlignVertical="top"
            style={styles.feedbackInput}
          />
          <View style={styles.feedbackActions}>
            <Button
              label="Cancel"
              variant="outline"
              onPress={() => {
                setFeedback('');
                setFeedbackOpen(false);
              }}
              style={styles.feedbackBtn}
            />
            <Button
              label="Save feedback"
              onPress={saveFeedback}
              loading={savingFeedback}
              disabled={!feedback.trim() || savingFeedback}
              style={styles.feedbackBtn}
            />
          </View>
        </View>
      ) : (
        <ScalePressable hapticStyle="select" onPress={() => setFeedbackOpen(true)}>
          <Text variant="caption" color="secondary" style={styles.feedbackLink}>
            {comments.length > 0 ? '+ Add feedback' : '+ Feedback'}
          </Text>
        </ScalePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  index: {
    fontFamily: tokens.fontFamily.medium,
  },
  name: {
    fontFamily: tokens.fontFamily.semibold,
  },
  files: {
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
  empty: {
    marginTop: tokens.spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
  scoreLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  scoreInput: {
    width: 64,
    height: 40,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.sm,
    textAlign: 'center',
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fontFamily.medium,
    fontSize: tokens.fontSize.md,
    backgroundColor: tokens.colors.surfaceAlt,
  },
  checkBtn: {
    marginLeft: 'auto',
  },
  comments: {
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
  comment: {
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
  },
  feedbackLink: {
    marginTop: tokens.spacing.sm,
    fontFamily: tokens.fontFamily.semibold,
  },
  feedbackBox: {
    marginTop: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  feedbackInput: {
    minHeight: 88,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surfaceAlt,
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fontFamily.regular,
    fontSize: tokens.fontSize.md,
  },
  feedbackActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  feedbackBtn: {
    flex: 1,
  },
});
