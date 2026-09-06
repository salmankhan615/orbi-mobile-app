import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Screen } from '@/components/custom/Screen';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { useCourse } from '@/queries/useCourses';
import { findLesson } from '@/features/courses/lessonHelpers';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import { smoothScrollProps } from '@/utils/scroll';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'LessonPlayer'>;

function LessonVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.play();
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      allowsPictureInPicture
      contentFit="contain"
      nativeControls
    />
  );
}

export function LessonPlayerScreen({ route, navigation }: Props) {
  const { courseId, lessonId: initialLessonId } = route.params;
  const { data: course, isLoading } = useCourse(courseId);
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId);
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  if (isLoading || !course) {
    return (
      <Screen edges={['top', 'bottom']} style={styles.loading}>
        <Text variant="body" color="textMuted">
          Loading…
        </Text>
      </Screen>
    );
  }

  const match = findLesson(course, activeLessonId);
  if (!match) {
    return (
      <Screen edges={['top', 'bottom']} style={styles.loading}>
        <Text variant="body" color="textMuted">
          Lesson not found
        </Text>
      </Screen>
    );
  }

  const { lesson, index, lessons } = match;
  const nextLesson = lessons[index + 1];
  const prevLesson = lessons[index - 1];

  function openLesson(id: string, status: string) {
    if (status === 'locked') {
      haptics.warning();
      showToast('Complete previous lessons to unlock this one.', 'neutral');
      return;
    }
    setActiveLessonId(id);
  }

  function goNext() {
    if (!nextLesson) return;
    openLesson(nextLesson.id, nextLesson.status);
  }

  function markComplete() {
    haptics.success();
    showToast('Lesson marked complete', 'success');
    if (nextLesson && nextLesson.status !== 'locked') {
      setActiveLessonId(nextLesson.id);
    }
  }

  function showLessonMenu() {
    Alert.alert(lesson.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Back to course',
        onPress: () => navigation.navigate('CourseDetail', { courseId: course!.id }),
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.playerChrome, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <IconButton
            name="arrow-back"
            color="onPrimary"
            background="glassTint"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.topBarCopy}>
            <Text variant="caption" color="onPrimary" style={styles.courseLabel} numberOfLines={1}>
              {course.title}
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
          <IconButton
            name="ellipsis-horizontal"
            color="onPrimary"
            background="glassTint"
            onPress={showLessonMenu}
          />
        </View>

        <View style={styles.videoWrap}>
          <LessonVideo key={lesson.id} uri={lesson.videoUrl} />
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
            label={
              lesson.status === 'done'
                ? 'Completed'
                : lesson.status === 'current'
                  ? 'In Progress'
                  : 'Locked'
            }
            tone={lesson.status === 'done' ? 'success' : 'primary'}
          />
          <Text variant="caption" color="textMuted">
            {lesson.durationLabel}
          </Text>
          <Text variant="caption" color="textMuted">
            Lesson {index + 1} of {lessons.length}
          </Text>
        </View>

        <Text variant="heading" style={styles.title}>
          {lesson.title}
        </Text>
        <Text variant="bodySmall" color="textSecondary" style={styles.moduleHint}>
          {lesson.moduleTitle}
        </Text>
        <Text variant="body" color="textSecondary">
          {lesson.description}
        </Text>

        <View style={styles.actions}>
          <Button
            label="Mark Complete"
            icon="checkmark-circle"
            onPress={markComplete}
            style={styles.actionPrimary}
          />
          <View style={styles.navRow}>
            <Button
              label="Previous"
              variant="outline"
              icon="arrow-back"
              disabled={!prevLesson}
              onPress={() => prevLesson && openLesson(prevLesson.id, prevLesson.status)}
              style={styles.navBtn}
            />
            <Button
              label="Next"
              variant="outline"
              icon="arrow-forward"
              disabled={!nextLesson || nextLesson.status === 'locked'}
              onPress={goNext}
              style={styles.navBtn}
            />
          </View>
        </View>

        <Text variant="title" style={styles.playlistTitle}>
          Course playlist
        </Text>
        {lessons.map((item) => {
          const isActive = item.id === lesson.id;
          return (
            <ScalePressable
              key={item.id}
              hapticStyle="select"
              onPress={() => openLesson(item.id, item.status)}
              style={isActive ? [styles.playlistRow, styles.playlistRowActive] : styles.playlistRow}
            >
              <Ionicons
                name={
                  item.status === 'done'
                    ? 'checkmark-circle'
                    : item.status === 'locked'
                      ? 'lock-closed'
                      : isActive
                        ? 'play-circle'
                        : 'play-circle-outline'
                }
                size={20}
                color={
                  item.status === 'done'
                    ? tokens.colors.success
                    : item.status === 'locked'
                      ? tokens.colors.textMuted
                      : isActive
                        ? tokens.colors.primary
                        : tokens.colors.textSecondary
                }
              />
              <View style={styles.playlistBody}>
                <Text
                  variant="bodySmall"
                  color={item.status === 'locked' ? 'textMuted' : 'textPrimary'}
                  style={isActive ? styles.playlistTitleActive : undefined}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text variant="caption" color="textMuted">
                  {item.durationLabel}
                </Text>
              </View>
              {isActive && <Badge label="Playing" tone="success" />}
            </ScalePressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerChrome: {
    backgroundColor: tokens.colors.primary,
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
  videoWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: tokens.colors.primary,
  },
  video: {
    width: '100%',
    height: '100%',
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
  actions: {
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.sm,
  },
  actionPrimary: {
    alignSelf: 'stretch',
  },
  navRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  navBtn: {
    flex: 1,
  },
  playlistTitle: {
    marginBottom: tokens.spacing.md,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    marginBottom: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  playlistRowActive: {
    borderColor: tokens.colors.success,
    backgroundColor: tokens.colors.successMuted,
  },
  playlistBody: {
    flex: 1,
    gap: 2,
  },
  playlistTitleActive: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
