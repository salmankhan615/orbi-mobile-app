import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type {
  CategoryProgress,
  CoursesOverview,
  DashboardStatCards,
  StudentDashboardModel,
} from '@/features/home/dashboardStats';
import type { ColorToken } from '@/theme/colors';

interface StudentDashboardProps {
  data: StudentDashboardModel;
}

const OVERVIEW_SEGMENTS: {
  key: keyof Pick<CoursesOverview, 'completed' | 'inProgress' | 'notStarted' | 'expired'>;
  label: string;
  colorKey: ColorToken;
}[] = [
  { key: 'completed', label: 'Completed', colorKey: 'chartCompleted' },
  { key: 'inProgress', label: 'In Progress', colorKey: 'chartInProgress' },
  { key: 'notStarted', label: 'Not Started', colorKey: 'chartNotStarted' },
  { key: 'expired', label: 'Access Expired', colorKey: 'chartExpired' },
];

const CATEGORY_COLORS: ColorToken[] = [
  'primary',
  'secondary',
  'tertiary',
  'categoryTeal',
  'categoryPurple',
  'categoryAmber',
  'categoryNavy',
  'success',
];

export function StudentDashboard({ data }: StudentDashboardProps) {
  return (
    <View style={styles.root}>
      <PieOverviewCard overview={data.overview} />
      <CategoryProgressCard categories={data.categories} />
      <StatsGrid stats={data.stats} />
    </View>
  );
}

function PieOverviewCard({ overview }: { overview: CoursesOverview }) {
  const size = 168;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(overview.total, 1);

  const arcs = OVERVIEW_SEGMENTS.reduce<
    {
      key: (typeof OVERVIEW_SEGMENTS)[number]['key'];
      label: string;
      colorKey: ColorToken;
      value: number;
      length: number;
      offset: number;
    }[]
  >((acc, segment) => {
    const value = overview[segment.key];
    const length = (value / total) * circumference;
    const offset = acc.reduce((sum, item) => sum + item.length, 0);
    acc.push({ ...segment, value, length, offset });
    return acc;
  }, []);

  return (
    <View style={styles.card}>
      <Text variant="title">Courses overview</Text>

      {overview.total === 0 ? (
        <Text variant="bodySmall" color="textMuted" style={styles.empty}>
          No allocated courses found.
        </Text>
      ) : (
        <View style={styles.pieLayout}>
          <View style={styles.donutWrap}>
            <Svg width={size} height={size}>
              <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={tokens.colors.surfaceAlt}
                  strokeWidth={stroke}
                  fill="none"
                />
                {arcs
                  .filter((arc) => arc.value > 0)
                  .map((arc) => (
                    <Circle
                      key={arc.key}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={tokens.colors[arc.colorKey]}
                      strokeWidth={stroke}
                      fill="none"
                      strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                      strokeDashoffset={-arc.offset}
                      strokeLinecap="butt"
                    />
                  ))}
              </G>
            </Svg>
            <View style={styles.donutCenter}>
              <Text variant="caption" color="textMuted">
                Total
              </Text>
              <Text variant="heading" style={styles.donutValue}>
                {overview.total}
              </Text>
            </View>
          </View>

          <View style={styles.legend}>
            {OVERVIEW_SEGMENTS.map((segment) => (
              <View key={segment.key} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: tokens.colors[segment.colorKey] }]}
                />
                <View style={styles.legendCopy}>
                  <Text variant="caption" color="textMuted">
                    {segment.label}
                  </Text>
                  <Text variant="bodySmall" style={styles.legendValue}>
                    {overview[segment.key]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function CategoryProgressCard({ categories }: { categories: CategoryProgress[] }) {
  const maxProgress = Math.max(...categories.map((item) => item.avgProgress), 1);

  return (
    <View style={styles.card}>
      <Text variant="title">Category progress</Text>

      {categories.length === 0 ? (
        <Text variant="bodySmall" color="textMuted" style={styles.empty}>
          No category data available.
        </Text>
      ) : (
        <View style={styles.categoryList}>
          {categories.map((item, index) => {
            const color = tokens.colors[CATEGORY_COLORS[index % CATEGORY_COLORS.length]];
            const widthPct = Math.round((item.avgProgress / maxProgress) * 100);
            return (
              <View key={`${item.title}-${index}`} style={styles.categoryRow}>
                <View style={styles.categoryMeta}>
                  <Text variant="bodySmall" style={styles.categoryTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {item.avgProgress}% · {item.coursesCount}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(Math.max(widthPct, item.avgProgress > 0 ? 6 : 0), 100)}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function StatsGrid({ stats }: { stats: DashboardStatCards }) {
  return (
    <View style={styles.statsCard}>
      <StatBlock
        title="Training hours"
        items={[
          { label: 'Total', value: stats.trainingHours.total },
          { label: 'Booked', value: stats.trainingHours.booked },
          { label: 'Remaining', value: stats.trainingHours.remaining },
        ]}
      />
      <View style={styles.statsRule} />
      <StatBlock
        title="Allocated courses"
        items={[
          { label: 'Theory', value: String(stats.allocatedCourses.theory) },
          { label: 'Practical', value: String(stats.allocatedCourses.practical) },
        ]}
      />
      <View style={styles.statsRule} />
      <StatBlock
        title="Special classes"
        items={[
          { label: 'Booked', value: String(stats.specialClasses.booked) },
          { label: 'Cancelled', value: String(stats.specialClasses.cancelled) },
        ]}
      />
      <View style={styles.statsRule} />
      <StatBlock
        title="Training shifts"
        items={[
          { label: 'Booked', value: String(stats.trainingShifts.booked) },
          { label: 'Cancelled', value: String(stats.trainingShifts.cancelled) },
        ]}
      />
    </View>
  );
}

function StatBlock({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <View style={styles.statBlock}>
      <Text variant="bodySmall" style={styles.statBlockTitle}>
        {title}
      </Text>
      <View style={styles.statItems}>
        {items.map((item) => (
          <View key={item.label} style={styles.statItem}>
            <Text variant="caption" color="textMuted">
              {item.label}
            </Text>
            <Text variant="title" style={styles.statItemValue}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.spacing.md,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: tokens.spacing.md,
  },
  pieLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.lg,
  },
  donutWrap: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: {
    fontFamily: tokens.fontFamily.bold,
    marginTop: -2,
  },
  legend: {
    flex: 1,
    gap: tokens.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  legendValue: {
    fontFamily: tokens.fontFamily.semibold,
  },
  categoryList: {
    gap: tokens.spacing.md,
  },
  categoryRow: {
    gap: tokens.spacing.xs,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  categoryTitle: {
    flex: 1,
    fontFamily: tokens.fontFamily.semibold,
  },
  barTrack: {
    height: 10,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: tokens.radius.full,
  },
  statsCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingVertical: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  statsRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.lg,
  },
  statBlock: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  statBlockTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  statItems: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  statItem: {
    flex: 1,
    gap: 2,
  },
  statItemValue: {
    fontFamily: tokens.fontFamily.bold,
  },
});
