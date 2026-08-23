import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { setStatusBarStyle } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { useCourse } from '@/queries/useCourses';
import { ModuleAccordionItem } from '@/features/courses/components/ModuleAccordionItem';
import { STATUS_LABEL } from '@/features/courses/categoryStyle';
import { findContinueLesson } from '@/features/courses/lessonHelpers';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import type { Lesson } from '@/api/courses';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'CourseDetail'>;
type Tab = 'Modules' | 'About' | 'Resources' | 'Announcements';
const TABS: Tab[] = ['Modules', 'About', 'Resources', 'Announcements'];

export function CourseDetailScreen({ route, navigation }: Props) {
  const { data: course, isLoading } = useCourse(route.params.courseId);
  const [activeTab, setActiveTab] = useState<Tab>('Modules');
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.show);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  function openLesson(lesson: Lesson) {
    if (!course) return;
    if (lesson.status === 'locked') {
      haptics.warning();
      showToast('Complete previous lessons to unlock this one.', 'neutral');
      return;
    }
    navigation.navigate('LessonPlayer', { courseId: course.id, lessonId: lesson.id });
  }

  function continueLearning() {
    if (!course) return;
    const next = findContinueLesson(course);
    if (!next) {
      showToast('No lessons available yet.', 'neutral');
      return;
    }
    navigation.navigate('LessonPlayer', { courseId: course.id, lessonId: next.id });
  }

  if (isLoading || !course) {
    return (
      <View style={styles.loading}>
        <Text variant="body" color="textMuted">
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={tokens.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + tokens.spacing.md }]}
      >
        <View style={styles.topBar}>
          <IconButton
            name="arrow-back"
            color="onPrimary"
            background="glassTint"
            onPress={() => navigation.goBack()}
          />
          <IconButton name="share-outline" color="onPrimary" background="glassTint" />
        </View>
        <Text variant="heading" color="onPrimary" style={styles.heroTitle}>
          {course.title}
        </Text>
        <Badge label={STATUS_LABEL[course.status]} tone="success" />
        <Text variant="bodySmall" color="onPrimary" style={styles.heroDesc}>
          {course.description}
        </Text>
        <Ionicons
          name="analytics-outline"
          size={48}
          color={tokens.colors.glassBorder}
          style={styles.heroGraphic}
        />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="albums-outline" size={18} color={tokens.colors.primary} />
            <Text variant="title">{course.moduleCount}</Text>
            <Text variant="caption" color="textMuted">
              Modules
            </Text>
          </View>
          <View style={styles.statLine} />
          <View style={styles.stat}>
            <Ionicons name="trending-up-outline" size={18} color={tokens.colors.success} />
            <Text variant="title">{course.progress}%</Text>
            <Text variant="caption" color="textMuted">
              Progress
            </Text>
          </View>
          <View style={styles.statLine} />
          <View style={styles.stat}>
            <Ionicons name="school-outline" size={18} color={tokens.colors.primary} />
            <Text variant="title">{course.level}</Text>
            <Text variant="caption" color="textMuted">
              Level
            </Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text variant="title">Course Progress</Text>
            <Text variant="bodySmall" color="success" style={styles.progressPct}>
              {course.progress}%
            </Text>
          </View>
          <ProgressBar progress={course.progress} fillColor="success" height={8} />
        </View>

        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <ScalePressable key={tab} onPress={() => setActiveTab(tab)} haptic={false}>
                <View style={[styles.tab, isActive && styles.tabActive]}>
                  <Text
                    variant="bodySmall"
                    color={isActive ? 'success' : 'textMuted'}
                    style={styles.tabLabel}
                  >
                    {tab}
                  </Text>
                </View>
              </ScalePressable>
            );
          })}
        </View>

        {activeTab === 'Modules' && (
          <View style={styles.modules}>
            {course.modules.map((module, index) => (
              <ModuleAccordionItem
                key={module.id}
                module={module}
                defaultExpanded={index === 0}
                onLessonPress={openLesson}
              />
            ))}
          </View>
        )}
        {activeTab !== 'Modules' && (
          <Text variant="body" color="textMuted" style={styles.emptyTab}>
            No {activeTab.toLowerCase()} yet.
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}>
        <Button label="Continue Learning" icon="arrow-forward" onPress={continueLearning} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface,
  },
  hero: {
    paddingHorizontal: tokens.spacing.screen,
    paddingBottom: tokens.spacing.xxxl,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
  },
  heroTitle: {
    marginBottom: tokens.spacing.sm,
  },
  heroDesc: {
    marginTop: tokens.spacing.md,
    opacity: 0.85,
    maxWidth: '90%',
  },
  heroGraphic: {
    position: 'absolute',
    right: tokens.spacing.xl,
    bottom: tokens.spacing.xl,
    opacity: 0.35,
  },
  scroll: {
    flex: 1,
    marginTop: -tokens.spacing.xxl,
  },
  body: {
    paddingBottom: tokens.spacing.xxxl,
  },
  stats: {
    flexDirection: 'row',
    marginHorizontal: tokens.spacing.screen,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    ...tokens.shadows.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  statLine: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: tokens.colors.border,
  },
  progressBlock: {
    marginHorizontal: tokens.spacing.screen,
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPct: {
    fontFamily: tokens.fontFamily.semibold,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: tokens.spacing.screen,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
  },
  tab: {
    paddingBottom: tokens.spacing.sm,
    marginRight: tokens.spacing.lg,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.success,
  },
  tabLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
  modules: {
    marginHorizontal: tokens.spacing.screen,
  },
  emptyTab: {
    textAlign: 'center',
    marginTop: tokens.spacing.xl,
  },
  footer: {
    padding: tokens.spacing.screen,
    backgroundColor: tokens.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
});
