import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { CourseworkFileChip } from '@/features/coursework/components/CourseworkFileChip';
import { Spinner } from '@/components/ui/Spinner';
import {
  formatCourseworkDate,
  isCourseworkOverdue,
  courseworkTabForKind,
} from '@/api/coursework';
import { useCoursework } from '@/queries/useCoursework';
import type { BadgeTone } from '@/components/ui/Badge';
import type { CourseworkFile, CourseworkItem } from '@/api/staff';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'CourseworkDetail'>;

const STATUS_TONE: Record<CourseworkItem['status'], BadgeTone> = {
  open: 'warning',
  submitted: 'success',
  graded: 'primary',
};

export function CourseworkDetailScreen({ navigation, route }: Props) {
  const { courseworkId } = route.params;
  const { data: items, isPending, isError, error } = useCoursework();

  const item = useMemo(
    () => (items ?? []).find((row) => row.id === courseworkId),
    [items, courseworkId],
  );

  function openFile(file: CourseworkFile) {
    navigation.navigate('CourseworkFile', {
      url: file.url,
      filename: file.filename,
      type: file.type,
    });
  }

  if (isPending) {
    return (
      <StackScreen title="Coursework">
        <Spinner fill label="Loading coursework…" />
      </StackScreen>
    );
  }

  if (isError || !item) {
    return (
      <StackScreen title="Coursework">
        <EmptyState
          icon="alert-circle-outline"
          message={
            error instanceof Error ? error.message : 'This coursework item could not be found.'
          }
        />
      </StackScreen>
    );
  }

  const overdue = isCourseworkOverdue(item);
  const submission = item.submission;
  const isAssignment = courseworkTabForKind(item.kind) === 'assignment';

  return (
    <StackScreen title={item.title}>
      <View style={styles.metaBlock}>
        <Text variant="caption" color="textSecondary">
          Group
        </Text>
        <Text variant="bodySmall" style={styles.metaValue}>
          {item.groupName ?? item.courseTitle}
        </Text>

        {isAssignment ? (
          <>
            <Text variant="caption" color="textSecondary" style={styles.metaLabel}>
              Due Date
            </Text>
            <Text
              variant="bodySmall"
              color={overdue ? 'danger' : 'textPrimary'}
              style={styles.metaValue}
            >
              {item.dueDate}
            </Text>

            {item.maxScore != null ? (
              <>
                <Text variant="caption" color="textSecondary" style={styles.metaLabel}>
                  Marks
                </Text>
                <Text variant="bodySmall" style={styles.metaValue}>
                  Out of {item.maxScore}
                </Text>
              </>
            ) : null}
          </>
        ) : null}

        {item.instructions ? (
          <>
            <Text variant="caption" color="textSecondary" style={styles.metaLabel}>
              Description
            </Text>
            <Text variant="bodySmall" style={styles.metaValue}>
              {item.instructions}
            </Text>
          </>
        ) : null}
      </View>

      {(item.attachments?.length ?? 0) > 0 ? (
        <View style={styles.section}>
          <Text variant="caption" color="textMuted" style={styles.sectionTitle}>
            Shared Files
          </Text>
          <View style={styles.fileList}>
            {item.attachments!.map((file) => (
              <CourseworkFileChip
                key={`${file.url}-${file.filename}`}
                file={file}
                onPress={() => openFile(file)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {isAssignment ? (
        <View style={styles.section}>
          <View style={styles.submissionHeader}>
            <Text variant="bodySmall" style={styles.submissionTitle}>
              Your submission
            </Text>
            <Badge label={item.status} tone={STATUS_TONE[item.status]} />
          </View>

          {submission ? (
            <>
              <View style={styles.submissionMeta}>
                {submission.score != null && item.maxScore != null ? (
                  <Text variant="bodySmall" color="success" style={styles.score}>
                    Score: {submission.score} / {item.maxScore}
                  </Text>
                ) : (
                  <View />
                )}
                {submission.submittedAt ? (
                  <Text variant="caption" color="textMuted">
                    Submitted {formatCourseworkDate(submission.submittedAt)}
                  </Text>
                ) : null}
              </View>

              {submission.gradedByName || submission.gradedAt ? (
                <Text variant="caption" color="textSecondary" style={styles.gradedBy}>
                  Graded by {submission.gradedByName ?? 'Staff'}
                  {submission.gradedAt ? ` · ${formatCourseworkDate(submission.gradedAt)}` : ''}
                </Text>
              ) : null}

              {(submission.files?.length ?? 0) > 0 ? (
                <View style={styles.fileList}>
                  {submission.files!.map((file) => (
                    <CourseworkFileChip
                      key={`${file.url}-${file.filename}`}
                      file={file}
                      onPress={() => openFile(file)}
                    />
                  ))}
                </View>
              ) : null}

              {(submission.comments?.length ?? 0) > 0 ? (
                <View style={styles.feedbackBlock}>
                  <Text variant="caption" color="textMuted" style={styles.sectionTitle}>
                    Feedback
                  </Text>
                  {submission.comments!.map((comment) => (
                    <View key={comment.id} style={styles.feedbackCard}>
                      <Text variant="bodySmall">{comment.text}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <Text variant="bodySmall" color="textMuted">
              No submission yet.
            </Text>
          )}
        </View>
      ) : null}

      {isAssignment && overdue ? (
        <Text variant="caption" color="danger" style={styles.closedNote}>
          Due date passed — submissions are closed.
        </Text>
      ) : null}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  metaBlock: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  metaLabel: {
    marginTop: tokens.spacing.md,
  },
  metaValue: {
    marginTop: 2,
    fontFamily: tokens.fontFamily.medium,
  },
  section: {
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  sectionTitle: {
    fontFamily: tokens.fontFamily.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  fileList: {
    gap: tokens.spacing.sm,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  submissionTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  submissionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  score: {
    fontFamily: tokens.fontFamily.semibold,
  },
  gradedBy: {
    marginTop: -2,
  },
  feedbackBlock: {
    marginTop: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  feedbackCard: {
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
  },
  closedNote: {
    fontFamily: tokens.fontFamily.medium,
    marginBottom: tokens.spacing.xl,
  },
});
