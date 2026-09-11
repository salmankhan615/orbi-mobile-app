import { ScrollView, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Screen } from '@/components/custom/Screen';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { sessionStatusBadge } from '@/api/sessions';
import { useSessions } from '@/queries/useSessions';
import { useCalendar } from '@/queries/useCalendars';
import { SESSION_TYPE_COLOR } from '@/features/calendar/sessionStyle';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { getMonthDateRange } from '@/utils/date';
import { smoothScrollProps } from '@/utils/scroll';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'DayAgenda'>;

function formatDayTitle(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DayAgendaScreen({ route, navigation }: Props) {
  const calendarId = route.params.calendarId;
  const dayDate = route.params.date;
  const range = getMonthDateRange(new Date(`${dayDate}T12:00:00`));
  const { data: sessions, isLoading } = useSessions({
    calendarId,
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const { data: calendar } = useCalendar(calendarId ?? 'all');

  const daySessions = (sessions ?? [])
    .filter((session) => session.date === dayDate)
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCopy}>
          <Text variant="title">{formatDayTitle(route.params.date)}</Text>
          {calendar && calendarId && calendarId !== 'all' ? (
            <Text variant="caption" color="textMuted">
              {calendar.name}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.timeline}
        {...smoothScrollProps}
      >
        {isLoading ? (
          <EntityListSkeleton rows={4} />
        ) : (
          <>
            {daySessions.map((session, index) => {
          const statusBadge = sessionStatusBadge(session);
          return (
          <View key={session.id} style={styles.timelineRow}>
            <View style={styles.timeCol}>
              <Text variant="caption" color="textSecondary" style={styles.timeLabel}>
                {session.startTime}
              </Text>
            </View>

            <View style={styles.timelineTrack}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: tokens.colors[SESSION_TYPE_COLOR[session.type]] },
                ]}
              />
              {index < daySessions.length - 1 && <View style={styles.line} />}
            </View>

            <ScalePressable
              style={styles.card}
              onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
            >
              <Text variant="caption" color="textSecondary">
                {session.startTime} - {session.endTime}
              </Text>
              <Text variant="body" style={styles.title}>
                {session.title}
              </Text>
              <View style={styles.footer}>
                <Text variant="caption" color="textMuted">
                  {session.code}
                </Text>
                <Badge label={statusBadge.label} tone={statusBadge.tone} />
              </View>
            </ScalePressable>
          </View>
          );
        })}

        {daySessions.length === 0 && (
          <Text variant="bodySmall" color="textMuted" style={styles.empty}>
            No sessions this day
            {calendar && calendarId && calendarId !== 'all' ? ` in ${calendar.name}` : ''}.
          </Text>
        )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  headerCopy: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerSpacer: {
    width: 40,
  },
  timeline: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxxl,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  timeCol: {
    width: 52,
    paddingTop: tokens.spacing.xs,
  },
  timeLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
  timelineTrack: {
    alignItems: 'center',
    width: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: tokens.spacing.xs,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: tokens.colors.border,
    marginTop: tokens.spacing.xs,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.xs,
    ...tokens.shadows.sm,
  },
  title: {
    fontFamily: tokens.fontFamily.semibold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xs,
  },
  empty: {
    textAlign: 'center',
    paddingTop: tokens.spacing.xl,
  },
});
