import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ScalePressable } from '@/components/custom/ScalePressable';
import type { CourseModule, Lesson, LessonMediaType } from '@/api/courses';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ModuleAccordionItemProps {
  module: CourseModule;
  defaultExpanded?: boolean;
  onLessonPress?: (lesson: Lesson) => void;
}

function primaryMediaType(lesson: Lesson): LessonMediaType | null {
  if (lesson.media?.some((item) => item.type === 'VIDEO')) return 'VIDEO';
  if (lesson.media?.some((item) => item.type === 'PDF')) return 'PDF';
  if (lesson.media?.some((item) => item.type === 'IMAGE')) return 'IMAGE';
  if (lesson.media?.length) return 'FILE';
  return null;
}

function lessonIcon(lesson: Lesson): keyof typeof Ionicons.glyphMap {
  if (lesson.status === 'done') return 'checkmark-circle';
  if (lesson.status === 'locked') return 'lock-closed-outline';
  const kind = primaryMediaType(lesson);
  if (kind === 'VIDEO') return 'play-circle';
  if (kind === 'PDF') return 'document-text';
  if (kind === 'IMAGE') return 'image';
  if (kind === 'FILE') return 'attach';
  return 'reader-outline';
}

export function ModuleAccordionItem({
  module,
  defaultExpanded = false,
  onLessonPress,
}: ModuleAccordionItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const doneCount = module.lessons.filter((lesson) => lesson.status === 'done').length;
  const total = module.lessons.length;
  const moduleDone = total > 0 && doneCount === total;

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={toggle}>
        <View style={styles.headerCopy}>
          <Text variant="bodySmall" style={styles.title}>
            {module.title}
          </Text>
          <Text variant="caption" color="textMuted">
            {doneCount}/{total} completed
          </Text>
        </View>
        {moduleDone ? <Badge label="Done" tone="success" /> : null}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={tokens.colors.textMuted}
        />
      </Pressable>

      {expanded && (
        <View style={styles.lessons}>
          {module.lessons.map((lesson) => {
            const isDone = lesson.status === 'done';
            return (
              <ScalePressable
                key={lesson.id}
                haptic={false}
                onPress={() => onLessonPress?.(lesson)}
                style={isDone ? [styles.lessonRow, styles.lessonRowDone] : styles.lessonRow}
              >
                <Ionicons
                  name={lessonIcon(lesson)}
                  size={18}
                  color={isDone ? tokens.colors.success : tokens.colors.info}
                />
                <View style={styles.lessonCopy}>
                  <Text
                    variant="bodySmall"
                    color={lesson.status === 'locked' ? 'textMuted' : 'textPrimary'}
                    style={styles.lessonTitle}
                  >
                    {lesson.title}
                  </Text>
                  <Text variant="caption" color={isDone ? 'success' : 'textMuted'}>
                    {isDone
                      ? 'Completed'
                      : lesson.durationLabel !== '—'
                        ? lesson.durationLabel
                        : 'Not completed'}
                    {lesson.hasQuiz && !isDone ? ' · Quiz on web' : ''}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={tokens.colors.textMuted}
                />
              </ScalePressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.lg,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
  },
  lessons: {
    paddingBottom: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xs,
    borderRadius: tokens.radius.md,
  },
  lessonRowDone: {
    backgroundColor: tokens.colors.successMuted,
    paddingHorizontal: tokens.spacing.sm,
  },
  lessonCopy: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    fontFamily: tokens.fontFamily.medium,
  },
});
