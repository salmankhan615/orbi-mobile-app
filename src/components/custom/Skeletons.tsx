import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Skeleton, SkeletonStack } from '@/components/ui/Skeleton';

function RowCard({ children }: { children: ReactNode }) {
  return <View style={styles.rowCard}>{children}</View>;
}

export function EntityListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <SkeletonStack>
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
    <SkeletonStack>
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
    <SkeletonStack>
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
    <SkeletonStack>
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
    <View style={styles.carousel}>
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} width={160} height={170} radius={tokens.radius.xl} />
      ))}
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View style={styles.pulse}>
      <Skeleton width="28%" height={10} />
      <Skeleton width="54%" height={20} />
      <View style={styles.pulseRow}>
        <Skeleton width="31%" height={36} radius={tokens.radius.md} />
        <Skeleton width="31%" height={36} radius={tokens.radius.md} />
        <Skeleton width="31%" height={36} radius={tokens.radius.md} />
      </View>
    </View>
  );
}

export function CalendarSkeleton() {
  return (
    <SkeletonStack gap={tokens.spacing.lg}>
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
      <EntityListSkeleton rows={3} />
    </SkeletonStack>
  );
}

export function DashboardSkeleton() {
  return (
    <SkeletonStack>
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
  pulse: {
    backgroundColor: tokens.colors.primaryMuted,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  pulseRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  carousel: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
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
