import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type {
  CategoryProgress,
  CoursesOverview,
  DashboardStatCards,
  StudentDashboardModel,
} from '@/features/home/dashboardStats';

interface StudentDashboardProps {
  data: StudentDashboardModel;
}

/** Same palette as CRM ApexCharts on student home. */
const BAR_COLORS = [
  '#01524B',
  '#20c997',
  '#0d6efd',
  '#6f42c1',
  '#fd7e14',
  '#17a2b8',
  '#ffc107',
  '#6c757d',
];

const OVERVIEW_SEGMENTS: {
  key: keyof Pick<CoursesOverview, 'completed' | 'inProgress' | 'notStarted' | 'expired'>;
  label: string;
  color: string;
}[] = [
  { key: 'completed', label: 'Completed', color: '#28a745' },
  { key: 'inProgress', label: 'In Progress', color: '#0d6efd' },
  { key: 'notStarted', label: 'Not Started', color: '#ffc107' },
  { key: 'expired', label: 'Access Expired', color: '#dc3545' },
];

export function StudentDashboard({ data }: StudentDashboardProps) {
  return (
    <View style={styles.root}>
      <View style={styles.chartsCard}>
        <CategoryProgressChart categories={data.categories} />
        <View style={styles.chartDivider} />
        <CoursesOverviewChart overview={data.overview} />
      </View>
      <StatsGrid stats={data.stats} />
    </View>
  );
}

function CategoryProgressChart({ categories }: { categories: CategoryProgress[] }) {
  const items =
    categories.length > 0 ? categories : [{ title: '—', coursesCount: 0, avgProgress: 0 }];

  return (
    <View style={styles.chartBlock}>
      <View style={styles.chartTitleRow}>
        <Ionicons name="bar-chart-outline" size={14} color={tokens.colors.textMuted} />
        <Text variant="overline" color="textMuted" style={styles.chartTitle}>
          Course Category-wise Progress
        </Text>
      </View>

      {categories.length === 0 ? (
        <Text variant="caption" color="textMuted" style={styles.empty}>
          No category data available
        </Text>
      ) : (
        <View style={styles.barChart}>
          <View style={styles.yAxis}>
            {[100, 80, 60, 40, 20, 0].map((tick) => (
              <Text key={tick} variant="caption" color="textMuted" style={styles.yTick}>
                {tick}%
              </Text>
            ))}
          </View>
          <View style={styles.barsArea}>
            <View style={styles.gridLines}>
              {[0, 1, 2, 3, 4, 5].map((line) => (
                <View key={line} style={styles.gridLine} />
              ))}
            </View>
            <View style={styles.barsRow}>
              {items.map((item, index) => (
                <View key={`${item.title}-${index}`} style={styles.barCol}>
                  <Text variant="caption" color="textPrimary" style={styles.barLabel}>
                    {item.avgProgress}% ({item.coursesCount})
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: Math.max(
                            (item.avgProgress / 100) * 120,
                            item.avgProgress > 0 ? 4 : 0,
                          ),
                          backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                        },
                      ]}
                    />
                  </View>
                  <Text
                    variant="caption"
                    color="textSecondary"
                    numberOfLines={2}
                    style={styles.barCategory}
                  >
                    {item.title} ({item.coursesCount})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function CoursesOverviewChart({ overview }: { overview: CoursesOverview }) {
  const size = 160;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(overview.total, 1);

  let offset = 0;
  const arcs = OVERVIEW_SEGMENTS.map((segment) => {
    const value = overview[segment.key];
    const length = (value / total) * circumference;
    const arc = { ...segment, value, length, offset };
    offset += length;
    return arc;
  });

  return (
    <View style={styles.chartBlock}>
      <View style={styles.chartTitleRow}>
        <Ionicons name="pie-chart-outline" size={14} color={tokens.colors.textMuted} />
        <Text variant="overline" color="textMuted" style={styles.chartTitle}>
          Total Courses Overview Chart
        </Text>
      </View>

      {overview.total === 0 ? (
        <Text variant="caption" color="textMuted" style={styles.empty}>
          No allocated courses found
        </Text>
      ) : (
        <>
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
                      stroke={arc.color}
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
              <Text variant="caption" color="textMuted" style={styles.donutCenterLabel}>
                Total Courses
              </Text>
              <Text variant="heading" style={styles.donutCenterValue}>
                {overview.total}
              </Text>
            </View>
          </View>

          <View style={styles.legend}>
            {OVERVIEW_SEGMENTS.map((segment) => (
              <View key={segment.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
                <Text variant="caption" color="textSecondary">
                  {segment.label}
                  {overview[segment.key] > 0 ? ` · ${overview[segment.key]}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function StatsGrid({ stats }: { stats: DashboardStatCards }) {
  return (
    <View style={styles.statsGrid}>
      <StatCard
        title="Training Hours"
        columns={[
          { label: 'Total', value: stats.trainingHours.total },
          { label: 'Booked', value: stats.trainingHours.booked },
          { label: 'Remaining', value: stats.trainingHours.remaining },
        ]}
      />
      <StatCard
        title="Allocated Courses"
        columns={[
          { label: 'Theory', value: String(stats.allocatedCourses.theory) },
          { label: 'Practical', value: String(stats.allocatedCourses.practical) },
        ]}
      />
      <StatCard
        title="Special Classes"
        columns={[
          { label: 'Booked', value: String(stats.specialClasses.booked) },
          { label: 'Cancelled', value: String(stats.specialClasses.cancelled) },
        ]}
      />
      <StatCard
        title="Training Shifts"
        columns={[
          { label: 'Booked', value: String(stats.trainingShifts.booked) },
          { label: 'Cancelled', value: String(stats.trainingShifts.cancelled) },
        ]}
      />
    </View>
  );
}

function StatCard({
  title,
  columns,
}: {
  title: string;
  columns: { label: string; value: string }[];
}) {
  return (
    <View style={styles.statCard}>
      <Text variant="bodySmall" style={styles.statTitle}>
        {title}
      </Text>
      <View style={styles.statColumns}>
        {columns.map((column) => (
          <View key={column.label} style={styles.statColumn}>
            <Text variant="caption" color="textMuted">
              {column.label}
            </Text>
            <Text variant="bodySmall" style={styles.statValue}>
              {column.value}
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
  chartsCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  chartBlock: {
    gap: tokens.spacing.md,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  chartTitle: {
    letterSpacing: 0.4,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: tokens.spacing.lg,
  },
  chartDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.colors.border,
  },
  barChart: {
    flexDirection: 'row',
    minHeight: 180,
    gap: tokens.spacing.xs,
  },
  yAxis: {
    justifyContent: 'space-between',
    height: 138,
    width: 36,
  },
  yTick: {
    fontSize: tokens.fontSize.xs,
  },
  barsArea: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.colors.border,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tokens.spacing.sm,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barLabel: {
    fontFamily: tokens.fontFamily.medium,
    fontSize: tokens.fontSize.xs,
    marginBottom: 4,
  },
  barTrack: {
    width: '70%',
    height: 120,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: tokens.radius.sm,
    borderTopRightRadius: tokens.radius.sm,
  },
  barCategory: {
    textAlign: 'center',
    width: '100%',
    fontSize: tokens.fontSize.xs,
    marginTop: tokens.spacing.xs,
    minHeight: 28,
  },
  donutWrap: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  donutCenterValue: {
    marginTop: -2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  statTitle: {
    fontFamily: tokens.fontFamily.semibold,
    textAlign: 'center',
  },
  statColumns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statColumn: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statValue: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
