import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FadeInView } from '@/components/custom/FadeInView';
import { staggerDelay } from '@/utils/formatters';
import type { Course } from '@/api/courses';
import { CATEGORY_GRADIENT, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE } from '../categoryStyle';

interface CourseCardProps {
  course: Course;
  index?: number;
  onPress?: () => void;
}

/** Reference list card: gradient icon tile, title, status, green progress, meta. */
export function CourseCard({ course, index = 0, onPress }: CourseCardProps) {
  const gradient = tokens.gradients[CATEGORY_GRADIENT[course.category]];

  return (
    <FadeInView delay={staggerDelay(index)}>
      <ScalePressable onPress={onPress} style={styles.card}>
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.icon}
        >
          <Ionicons
            name={CATEGORY_ICON[course.category]}
            size={22}
            color={tokens.colors.onPrimary}
          />
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.top}>
            <Text variant="bodySmall" style={styles.title} numberOfLines={1}>
              {course.title}
            </Text>
            <Badge label={STATUS_LABEL[course.status]} tone={STATUS_TONE[course.status]} />
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <ProgressBar progress={course.progress} fillColor="success" height={5} />
            </View>
            <Text variant="caption" color="success" style={styles.pct}>
              {course.progress}%
            </Text>
          </View>

          <View style={styles.meta}>
            <Text variant="caption" color="textMuted">
              {course.moduleCount} Modules
            </Text>
            <View style={styles.dot} />
            <Text variant="caption" color="textMuted">
              {course.level}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
      </ScalePressable>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: tokens.spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: tokens.fontFamily.semibold,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  progressTrack: {
    flex: 1,
  },
  pct: {
    fontFamily: tokens.fontFamily.semibold,
    minWidth: 36,
    textAlign: 'right',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: tokens.colors.textMuted,
  },
});
