import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '@/theme';
import { Skeleton, SkeletonStack } from '@/components/ui/Skeleton';

function RowCard({ children }: { children: ReactNode }) {
  return <View style={styles.rowCard}>{children}</View>;
}

export function EntityListSkeleton({
  rows = 4,
  flush = false,
}: {
  rows?: number;
  flush?: boolean;
}) {
  return (
    <SkeletonStack style={flush ? undefined : styles.block}>
      {Array.from({ length: rows }, (_, index) => (
        <RowCard key={index}>
          <Skeleton circle height={40} />
          <View style={styles.rowCopy}>
            <Skeleton width="62%" height={14} />
            <Skeleton width="40%" height={10} />
          </View>
        </RowCard>
      ))}
    </SkeletonStack>
  );
}

export function CourseListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <SkeletonStack style={styles.block}>
      {Array.from({ length: rows }, (_, index) => (
        <RowCard key={index}>
          <Skeleton width={52} height={52} radius={tokens.radius.md} />
          <View style={styles.rowCopy}>
            <Skeleton width="78%" height={14} />
            <Skeleton width="100%" height={6} radius={tokens.radius.full} />
            <Skeleton width="36%" height={10} />
          </View>
        </RowCard>
      ))}
    </SkeletonStack>
  );
}

export function ConversationListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonStack style={styles.block}>
      {Array.from({ length: rows }, (_, index) => (
        <RowCard key={index}>
          <Skeleton circle height={48} />
          <View style={styles.rowCopy}>
            <Skeleton width="50%" height={14} />
            <Skeleton width="70%" height={10} />
            <Skeleton width="40%" height={10} />
          </View>
        </RowCard>
      ))}
    </SkeletonStack>
  );
}

export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <SkeletonStack style={styles.block}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.blockCard}>
          <Skeleton width="55%" height={12} />
          <Skeleton width="88%" height={16} />
          <Skeleton width="42%" height={10} />
        </View>
      ))}
    </SkeletonStack>
  );
}

export function CourseCarouselSkeleton() {
  return (
    <View style={[styles.carousel, styles.block]}>
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} style={styles.courseCard}>
          <Skeleton width={42} height={42} radius={tokens.radius.md} />
          <View style={styles.courseCardCopy}>
            <Skeleton width="92%" height={12} />
            <Skeleton width="64%" height={12} />
          </View>
          <View style={styles.courseCardMeta}>
            <Skeleton width="100%" height={4} radius={tokens.radius.full} />
            <View style={styles.courseCardFooter}>
              <Skeleton width={28} height={10} />
              <Skeleton width={52} height={10} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View style={styles.pulseWrap}>
      <LinearGradient
        colors={tokens.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pulse}
      >
        <View style={styles.pulseTop}>
          <View style={styles.pulseCopy}>
            <Skeleton width="28%" height={10} style={styles.pulseBone} />
            <Skeleton width="62%" height={20} style={styles.pulseBone} />
            <Skeleton width="48%" height={10} style={styles.pulseBone} />
          </View>
          <Skeleton width={28} height={28} radius={tokens.radius.md} style={styles.pulseBone} />
        </View>
        <View style={styles.pulseRow}>
          <View style={styles.pulseMini} />
          <View style={styles.pulseMini} />
          <View style={styles.pulseMini} />
        </View>
        <Skeleton width="38%" height={14} style={styles.pulseBone} />
      </LinearGradient>
    </View>
  );
}

export function CalendarSkeleton() {
  return (
    <SkeletonStack gap={tokens.spacing.lg} style={styles.block}>
      <View style={styles.monthCard}>
        {Array.from({ length: 6 }, (_, row) => (
          <View key={row} style={styles.weekRow}>
            {Array.from({ length: 7 }, (__, col) => (
              <View key={col} style={styles.dayCell}>
                <Skeleton circle height={32} />
              </View>
            ))}
          </View>
        ))}
      </View>
      <EntityListSkeleton rows={3} flush />
    </SkeletonStack>
  );
}

export function DashboardSkeleton() {
  return (
    <SkeletonStack style={styles.block}>
      <View style={styles.blockCard}>
        <Skeleton width="48%" height={18} />
        <View style={styles.dashRow}>
          <Skeleton circle height={120} />
          <View style={styles.rowCopy}>
            <Skeleton width="80%" height={12} />
            <Skeleton width="70%" height={12} />
            <Skeleton width="60%" height={12} />
            <Skeleton width="55%" height={12} />
          </View>
        </View>
      </View>
      <View style={styles.blockCard}>
        <Skeleton width="52%" height={18} />
        <Skeleton width="100%" height={10} radius={tokens.radius.full} />
        <Skeleton width="86%" height={10} radius={tokens.radius.full} />
        <Skeleton width="72%" height={10} radius={tokens.radius.full} />
      </View>
    </SkeletonStack>
  );
}

const styles = StyleSheet.create({
  block: {
    marginVertical: tokens.spacing.xl,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  rowCopy: {
    flex: 1,
    gap: tokens.spacing.sm,
  },
  blockCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  pulseWrap: {
    marginVertical: tokens.spacing.xl,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadows.md,
  },
  pulse: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  pulseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  pulseCopy: {
    flex: 1,
    gap: 4,
  },
  pulseBone: {
    backgroundColor: tokens.colors.glassTint,
  },
  pulseRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  pulseMini: {
    flex: 1,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.glassTint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.glassBorder,
  },
  carousel: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  courseCard: {
    width: 160,
    minHeight: 170,
    borderRadius: tokens.radius.xl,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    justifyContent: 'space-between',
    ...tokens.shadows.md,
  },
  courseCardCopy: {
    gap: tokens.spacing.sm,
    marginVertical: tokens.spacing.md,
  },
  courseCardMeta: {
    gap: tokens.spacing.sm,
  },
  courseCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
  },
  dashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.lg,
  },
});
