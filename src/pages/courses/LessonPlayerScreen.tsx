import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Screen } from '@/components/custom/Screen';
import { useCourse, useMarkLessonComplete } from '@/queries/useCourses';
import { findLessonInModule } from '@/features/courses/lessonHelpers';
import { CourseAccessLocked } from '@/features/courses/components/CourseAccessLocked';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import { smoothScrollProps } from '@/utils/scroll';
import type { LessonMedia } from '@/api/courses';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'LessonPlayer'>;

function mediaIcon(type: LessonMedia['type']): keyof typeof Ionicons.glyphMap {
  if (type === 'VIDEO') return 'videocam-outline';
  if (type === 'PDF') return 'document-text-outline';
  if (type === 'IMAGE') return 'image-outline';
  return 'attach-outline';
}

export function LessonPlayerScreen({ route, navigation }: Props) {
  const { courseId, lessonId: initialLessonId } = route.params;
  const { data: course, isLoading } = useCourse(courseId);
  const markCompleteMutation = useMarkLessonComplete(courseId);
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId);
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    setActiveLessonId(initialLessonId);
  }, [initialLessonId]);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  if (isLoading || !course) {
    return (
      <Screen edges={['top', 'bottom']} style={styles.loading}>
        <Spinner fill label="Loading lesson…" />
      </Screen>
    );
  }

  if (course.accessExpired) {
    return (
      <Screen edges={['top', 'bottom']} style={styles.lockedScreen}>
        <View style={styles.lockedHeader}>
          <IconButton name="arrow-back" onPress={() => navigation.goBack()} />
        </View>
        <CourseAccessLocked endLabel={course.accessEndLabel} variant="panel" />
        <View style={styles.lockedFooter}>
          <Button label="Back to course" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const match = findLessonInModule(course, activeLessonId);
  if (!match) {
    return (
      <Screen edges={['top', 'bottom']} style={styles.loading}>
        <Text variant="body" color="textMuted">
          Lesson not found
        </Text>
      </Screen>
    );
  }

  const { lesson, index, lessons, module } = match;
  const nextLesson = lessons[index + 1];
  const prevLesson = lessons[index - 1];
  const media = lesson.media?.length
    ? lesson.media
    : lesson.videoUrl
      ? [
          {
            id: `${lesson.id}-video`,
            type: 'VIDEO' as const,
            url: lesson.videoUrl,
            filename: 'video.mp4',
          },
        ]
      : [];
  const doneInModule = lessons.filter((item) => item.status === 'done').length;

  function markComplete() {
    if (lesson.status === 'done') return;
    markCompleteMutation.mutate(
      { sectionId: lesson.sectionId, lessonId: lesson.id },
      {
        onSuccess: () => {
          haptics.success();
          showToast('Lesson marked complete', 'success');
        },
        onError: () => {
          haptics.warning();
          showToast('Could not mark lesson complete', 'danger');
        },
      },
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.headerChrome, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <IconButton
            name="arrow-back"
            color="onPrimary"
            background="glassTint"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.topBarCopy}>
            <Text variant="caption" color="onPrimary" style={styles.courseLabel} numberOfLines={1}>
              {module.title}
            </Text>
            <Text
              variant="bodySmall"
              color="onPrimary"
              style={styles.lessonLabel}
              numberOfLines={1}
            >
              {lesson.title}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) + tokens.spacing.xxl },
        ]}
        {...smoothScrollProps}
      >
        <View style={styles.metaRow}>
          <Badge
            label={lesson.status === 'done' ? 'Completed' : 'Not completed'}
            tone={lesson.status === 'done' ? 'success' : 'neutral'}
          />
          <Text variant="caption" color="textMuted">
            {index + 1} of {lessons.length} in module
          </Text>
          <Text variant="caption" color="textMuted">
            {doneInModule}/{lessons.length} done
          </Text>
        </View>

        <Text variant="heading" style={styles.title}>
          {lesson.title}
        </Text>
        <Text variant="bodySmall" color="textSecondary" style={styles.moduleHint}>
          {module.title}
        </Text>
        {lesson.description !== lesson.title ? (
          <Text variant="body" color="textSecondary">
            {lesson.description}
          </Text>
        ) : null}

        {lesson.hasQuiz ? (
          <View style={styles.quizNote}>
            <Ionicons name="information-circle" size={16} color={tokens.colors.warning} />
            <Text variant="caption" color="textSecondary" style={styles.quizNoteText}>
              A quiz is attached on the web portal. Quizzes are not available in this app.
            </Text>
          </View>
        ) : null}

        {media.length > 0 ? (
          <View style={styles.materials}>
            <Text variant="title" style={styles.materialsTitle}>
              Materials
            </Text>
            {media.map((item) => (
              <View key={item.id} style={styles.materialRow}>
                <Ionicons name={mediaIcon(item.type)} size={18} color={tokens.colors.primary} />
                <View style={styles.materialCopy}>
                  <Text variant="bodySmall" numberOfLines={2}>
                    {item.filename}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {item.type}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actions}>
          {lesson.status === 'done' ? (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={20} color={tokens.colors.success} />
              <Text variant="bodySmall" color="success" style={styles.completedBannerText}>
                Already completed
              </Text>
            </View>
          ) : (
            <Button
              label="Mark Complete"
              icon="checkmark-circle"
              onPress={markComplete}
              loading={markCompleteMutation.isPending}
              disabled={markCompleteMutation.isPending}
              style={styles.actionPrimary}
            />
          )}

          <View style={styles.navRow}>
            <Button
              label="Previous"
              variant="outline"
              icon="arrow-back"
              disabled={!prevLesson}
              onPress={() => prevLesson && setActiveLessonId(prevLesson.id)}
              style={styles.navBtn}
            />
            <Button
              label="Next"
              variant="outline"
              icon="arrow-forward"
              disabled={!nextLesson}
              onPress={() => nextLesson && setActiveLessonId(nextLesson.id)}
              style={styles.navBtn}
            />
          </View>

          <Button
            label="Back to modules"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.actionPrimary}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedScreen: {
    justifyContent: 'flex-start',
  },
  lockedHeader: {
    paddingHorizontal: tokens.spacing.screen,
    marginBottom: tokens.spacing.lg,
  },
  lockedFooter: {
    marginTop: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.screen,
  },
  headerChrome: {
    backgroundColor: tokens.colors.primary,
    paddingBottom: tokens.spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.screen,
    paddingBottom: tokens.spacing.sm,
  },
  topBarCopy: {
    flex: 1,
    gap: 2,
  },
  courseLabel: {
    opacity: 0.75,
  },
  lessonLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  title: {
    marginBottom: tokens.spacing.xs,
  },
  moduleHint: {
    marginBottom: tokens.spacing.md,
    fontFamily: tokens.fontFamily.medium,
  },
  quizNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.warningMuted,
  },
  quizNoteText: {
    flex: 1,
  },
  materials: {
    marginTop: tokens.spacing.xl,
    gap: tokens.spacing.sm,
  },
  materialsTitle: {
    marginBottom: tokens.spacing.xs,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    ...tokens.shadows.sm,
  },
  materialCopy: {
    flex: 1,
    gap: 2,
  },
  actions: {
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.sm,
  },
  actionPrimary: {
    alignSelf: 'stretch',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.successMuted,
  },
  completedBannerText: {
    fontFamily: tokens.fontFamily.semibold,
  },
  navRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  navBtn: {
    flex: 1,
  },
});
