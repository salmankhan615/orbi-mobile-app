import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FadeInView } from '@/components/custom/FadeInView';
import { staggerDelay } from '@/utils/formatters';
import type { Course } from '@/api/courses';
import { CATEGORY_GRADIENT, CATEGORY_ICON, STATUS_LABEL } from '../categoryStyle';

interface CourseSummaryCardProps {
  course: Course;
  index?: number;
  onPress?: () => void;
}

export function CourseSummaryCard({ course, index = 0, onPress }: CourseSummaryCardProps) {
  const gradient = tokens.gradients[CATEGORY_GRADIENT[course.category]];
  const status =
    typeof course.accessExpired === 'boolean'
      ? course.accessExpired
        ? 'Access Expired'
        : 'Active'
      : course.status === 'in_progress'
        ? 'Active'
        : course.status === 'not_started'
          ? 'Not Started'
          : STATUS_LABEL[course.status];

  return (
    <FadeInView delay={staggerDelay(index)}>
      <ScalePressable onPress={onPress} style={styles.wrap}>
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.iconChip}>
            <Ionicons
              name={CATEGORY_ICON[course.category]}
              size={24}
              color={tokens.colors.onPrimary}
            />
          </View>
          <Text variant="bodySmall" color="onPrimary" style={styles.title} numberOfLines={2}>
            {course.title}
          </Text>
          <View style={styles.progressBlock}>
            <ProgressBar
              progress={course.progress}
              trackColor="glassTint"
              fillColor="onPrimary"
              height={4}
            />
            <View style={styles.progressMeta}>
              <Text variant="caption" color="onPrimary" style={styles.progressLabel}>
                {course.progress}%
              </Text>
              <Text variant="caption" color="onPrimary" style={styles.status}>
                {status}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ScalePressable>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: tokens.radius.xl,
    ...tokens.shadows.md,
  },
  card: {
    width: 160,
    minHeight: 170,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    justifyContent: 'space-between',
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.glassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
    marginVertical: tokens.spacing.md,
  },
  progressBlock: {
    gap: tokens.spacing.sm,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    opacity: 0.9,
    fontFamily: tokens.fontFamily.medium,
  },
  status: {
    opacity: 0.8,
  },
});
