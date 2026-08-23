import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';
import type { CourseModule, Lesson } from '@/api/courses';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ModuleAccordionItemProps {
  module: CourseModule;
  defaultExpanded?: boolean;
  onLessonPress?: (lesson: Lesson) => void;
}

const LESSON_ICON: Record<Lesson['status'], keyof typeof Ionicons.glyphMap> = {
  done: 'checkmark-circle',
  current: 'play-circle',
  locked: 'lock-closed-outline',
};

const LESSON_COLOR: Record<Lesson['status'], keyof typeof tokens.colors> = {
  done: 'success',
  current: 'info',
  locked: 'textMuted',
};

export function ModuleAccordionItem({
  module,
  defaultExpanded = false,
  onLessonPress,
}: ModuleAccordionItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={toggle}>
        <Text variant="bodySmall" style={styles.title}>
          {module.title}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={tokens.colors.textMuted}
        />
      </Pressable>

      {expanded && (
        <View style={styles.lessons}>
          {module.lessons.map((lesson) => (
            <ScalePressable
              key={lesson.id}
              haptic={false}
              onPress={() => onLessonPress?.(lesson)}
              style={styles.lessonRow}
            >
              <Ionicons
                name={LESSON_ICON[lesson.status]}
                size={18}
                color={tokens.colors[LESSON_COLOR[lesson.status]]}
              />
              <Text
                variant="bodySmall"
                color={lesson.status === 'locked' ? 'textMuted' : 'textPrimary'}
                style={styles.lessonTitle}
              >
                {lesson.title}
              </Text>
              {lesson.status !== 'locked' && (
                <Ionicons name="play" size={14} color={tokens.colors.textMuted} />
              )}
            </ScalePressable>
          ))}
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
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.lg,
  },
  title: {
    flex: 1,
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
  },
  lessonTitle: {
    flex: 1,
  },
});
