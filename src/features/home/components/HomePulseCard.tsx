import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';
import type { StudentDashboardModel } from '@/features/home/dashboardStats';

interface HomePulseCardProps {
  data: StudentDashboardModel;
  onPress: () => void;
}

/** Compact home teaser — only CRM fields, no invented metrics. */
export function HomePulseCard({ data, onPress }: HomePulseCardProps) {
  const { stats, overview } = data;

  return (
    <ScalePressable onPress={onPress} hapticStyle="select" style={styles.wrap}>
      <LinearGradient
        colors={tokens.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.copy}>
            <Text variant="overline" color="onPrimary" style={styles.eyebrow}>
              Dashboard
            </Text>
            <Text variant="title" color="onPrimary">
              {overview.total} Total Courses
            </Text>
            <Text variant="caption" color="onPrimary" style={styles.sub}>
              Training Hours remaining {stats.trainingHours.remaining}
            </Text>
          </View>
          <Ionicons name="stats-chart" size={28} color={tokens.colors.onPrimary} />
        </View>

        <View style={styles.row}>
          <Mini label="Completed" value={String(overview.completed)} />
          <Mini label="In Progress" value={String(overview.inProgress)} />
          <Mini label="Not Started" value={String(overview.notStarted)} />
        </View>

        <View style={styles.ctaRow}>
          <Text variant="bodySmall" color="onPrimary" style={styles.cta}>
            View dashboard
          </Text>
          <Ionicons name="arrow-forward" size={16} color={tokens.colors.onPrimary} />
        </View>
      </LinearGradient>
    </ScalePressable>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.mini}>
      <Text variant="caption" color="onPrimary" style={styles.miniLabel}>
        {label}
      </Text>
      <Text variant="bodySmall" color="onPrimary" style={styles.miniValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: tokens.spacing.xl,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadows.md,
  },
  card: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    opacity: 0.8,
    letterSpacing: 0.8,
  },
  sub: {
    opacity: 0.9,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  mini: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.glassTint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.glassBorder,
    gap: 2,
  },
  miniLabel: {
    opacity: 0.85,
  },
  miniValue: {
    fontFamily: tokens.fontFamily.semibold,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  cta: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
