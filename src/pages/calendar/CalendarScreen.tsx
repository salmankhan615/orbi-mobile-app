import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/custom/Screen';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { useSessions } from '@/queries/useSessions';
import { useCalendars } from '@/queries/useCalendars';
import { useClosedDays } from '@/queries/useStaff';
import type { Session } from '@/api/sessions';
import { CalendarPicker } from '@/features/calendar/components/CalendarPicker';
import { MonthGrid } from '@/features/calendar/components/MonthGrid';
import { WeekGrid } from '@/features/calendar/components/WeekGrid';
import { SessionListItem } from '@/features/calendar/components/SessionListItem';
import { SESSION_TYPE_COLOR } from '@/features/calendar/sessionStyle';
import {
  formatWeekRange,
  getVisibleCalendarRange,
  getWeekRange,
  MONTH_NAMES,
  toISODate,
} from '@/utils/date';
import { useIsStaff, useHasPermission } from '@/hooks/useHasPermission';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothScrollProps } from '@/utils/scroll';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Calendar'>;
type ViewMode = 'Month' | 'Week' | 'List';

function formatSessionDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function firstDateWithSessions(sessions: Session[]) {
  const dates = [...new Set(sessions.map((session) => session.date))].sort();
  return dates[0] ?? toISODate(new Date());
}

export function CalendarScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabPadding = useTabBarPadding();
  const { data: calendars } = useCalendars();
  const [selectedCalendarId, setSelectedCalendarId] = useState('all');
  const isStaff = useIsStaff();
  const canClose = useHasPermission('close_calendar');
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);

  const range = useMemo(
    () => getVisibleCalendarRange(cursor, viewMode),
    [cursor, viewMode],
  );
  const { data: sessions } = useSessions({
    calendarId: selectedCalendarId,
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const { data: closedDays = [] } = useClosedDays();

  const selectedCalendar =
    calendars?.find((calendar) => calendar.id === selectedCalendarId) ?? calendars?.[0];

  const periodLabel = useMemo(() => {
    if (viewMode === 'Week') {
      const { start, end } = getWeekRange(cursor);
      return formatWeekRange(start, end);
    }
    return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }, [viewMode, cursor]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const session of sessions ?? []) {
      const existing = map.get(session.date) ?? [];
      existing.push(session);
      map.set(session.date, existing);
    }
    return map;
  }, [sessions]);

  const sessionsForSelectedDate = sessionsByDate.get(selectedDate) ?? [];

  const groupedForList = useMemo(() => {
    const dates = Array.from(sessionsByDate.keys()).sort();
    return dates.map((date) => ({ date, sessions: sessionsByDate.get(date) ?? [] }));
  }, [sessionsByDate]);

  useEffect(() => {
    if (!sessions) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resyncs selection once sessions load/change, not a render loop
    setSelectedDate((current) =>
      sessions.some((session) => session.date === current)
        ? current
        : firstDateWithSessions(sessions),
    );
  }, [selectedCalendarId, sessions]);

  function changePeriod(delta: number) {
    if (viewMode === 'Week') {
      setCursor((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() + delta * 7);
        return next;
      });
      return;
    }
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function goToday() {
    const today = new Date();
    setCursor(today);
    setSelectedDate(toISODate(today));
  }

  function handleSelectDate(iso: string) {
    setSelectedDate(iso);
    if ((sessionsByDate.get(iso) ?? []).length > 0) {
      setSheetOpen(true);
    }
  }

  function handleCalendarChange(calendarId: string) {
    setSelectedCalendarId(calendarId);
    setSheetOpen(false);
  }

  return (
    <Screen style={styles.screen} background="surface">
      <View style={styles.header}>
        <Text variant="heading">My Calendar</Text>
        {isStaff && canClose ? (
          <IconButton
            name="close-circle-outline"
            background="surfaceAlt"
            onPress={() => navigation.navigate('CloseCalendar')}
          />
        ) : (
          <IconButton
            name="add"
            background="surfaceAlt"
            onPress={() => navigation.navigate('BookClass')}
          />
        )}
      </View>

      {calendars && calendars.length > 0 ? (
        <CalendarPicker
          calendars={calendars}
          selectedId={selectedCalendarId}
          onSelect={handleCalendarChange}
        />
      ) : null}

      <View style={styles.controls}>
        <View style={styles.monthNav}>
          <IconButton name="chevron-back" onPress={() => changePeriod(-1)} />
          <View style={styles.monthCopy}>
            <Text variant="title" numberOfLines={1} style={styles.periodLabel}>
              {periodLabel}
            </Text>
            {selectedCalendar && selectedCalendarId !== 'all' ? (
              <Text variant="caption" color="textMuted">
                {selectedCalendar.name}
              </Text>
            ) : null}
          </View>
          <IconButton name="chevron-forward" onPress={() => changePeriod(1)} />
        </View>
        <ScalePressable onPress={goToday} hapticStyle="select" style={styles.todayBtn}>
          <Text variant="caption" color="secondary" style={styles.todayLabel}>
            Today
          </Text>
        </ScalePressable>
      </View>

      <View style={styles.segmented}>
        {(['Month', 'Week', 'List'] as ViewMode[]).map((mode) => {
          const isActive = mode === viewMode;
          return (
            <ScalePressable
              key={mode}
              onPress={() => setViewMode(mode)}
              hapticStyle="select"
              style={isActive ? [styles.segment, styles.segmentActive] : styles.segment}
            >
              <Text
                variant="bodySmall"
                color={isActive ? 'onPrimary' : 'textSecondary'}
                style={styles.segmentLabel}
              >
                {mode}
              </Text>
            </ScalePressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        {...smoothScrollProps}
      >
        {viewMode !== 'List' && (
          <>
            <View style={styles.monthCard}>
              {viewMode === 'Month' ? (
                <MonthGrid
                  year={cursor.getFullYear()}
                  month={cursor.getMonth()}
                  selectedDate={selectedDate}
                  sessionsByDate={sessionsByDate}
                  closedDates={closedDays}
                  onSelectDate={handleSelectDate}
                />
              ) : (
                <WeekGrid
                  anchor={cursor}
                  selectedDate={selectedDate}
                  sessionsByDate={sessionsByDate}
                  closedDates={closedDays}
                  onSelectDate={handleSelectDate}
                />
              )}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: tokens.colors[SESSION_TYPE_COLOR.blue] }]}
                />
                <Text variant="caption" color="textMuted">
                  Booked
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: tokens.colors[SESSION_TYPE_COLOR.green] },
                  ]}
                />
                <Text variant="caption" color="textMuted">
                  Open to book
                </Text>
              </View>
            </View>

            <Text variant="title" style={styles.sessionsHeader}>
              Sessions on {formatSessionDate(selectedDate)}
            </Text>

            {sessionsForSelectedDate.map((session, index) => (
              <SessionListItem
                key={session.id}
                session={session}
                index={index}
                onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
              />
            ))}

            {sessionsForSelectedDate.length === 0 && (
              <Text variant="bodySmall" color="textMuted" style={styles.empty}>
                No sessions this day
                {selectedCalendarId !== 'all' ? ` in ${selectedCalendar?.name}` : ''}
              </Text>
            )}

            {sessionsForSelectedDate.length > 0 && (
              <Button
                label="View Full Day  →"
                onPress={() =>
                  navigation.navigate('DayAgenda', {
                    date: selectedDate,
                    calendarId: selectedCalendarId,
                  })
                }
                style={styles.viewFullDay}
              />
            )}
          </>
        )}

        {viewMode === 'List' &&
          groupedForList.map((group) => (
            <View key={group.date} style={styles.listGroup}>
              <Text variant="bodySmall" color="textSecondary" style={styles.listGroupHeader}>
                {formatSessionDate(group.date)}
              </Text>
              {group.sessions.map((session, index) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  index={index}
                  hideDate
                  showChevron
                  onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
                />
              ))}
            </View>
          ))}

        {viewMode === 'List' && groupedForList.length === 0 && (
          <Text variant="bodySmall" color="textMuted" style={styles.empty}>
            No sessions in this calendar yet.
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable style={styles.sheetDismiss} onPress={() => setSheetOpen(false)} />
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text variant="title">{formatSessionDate(selectedDate)}</Text>
              <IconButton name="close" onPress={() => setSheetOpen(false)} />
            </View>
            <ScrollView style={styles.sheetList} {...smoothScrollProps}>
              {sessionsForSelectedDate.map((session, index) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  index={index}
                  hideDate
                  showChevron
                  onPress={() => {
                    setSheetOpen(false);
                    navigation.navigate('SessionDetails', { sessionId: session.id });
                  }}
                />
              ))}
            </ScrollView>
            <Button
              label="View Full Day  →"
              icon="calendar-outline"
              onPress={() => {
                setSheetOpen(false);
                navigation.navigate('DayAgenda', {
                  date: selectedDate,
                  calendarId: selectedCalendarId,
                });
              }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    flex: 1,
  },
  monthCopy: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  periodLabel: {
    textAlign: 'center',
  },
  todayBtn: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.secondaryMuted,
  },
  todayLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.full,
    padding: 4,
    marginBottom: tokens.spacing.lg,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
  },
  segmentActive: {
    backgroundColor: tokens.colors.secondary,
  },
  segmentLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: tokens.spacing.xxxl,
  },
  monthCard: {
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionsHeader: {
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.md,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: tokens.spacing.xl,
  },
  viewFullDay: {
    marginTop: tokens.spacing.md,
  },
  listGroup: {
    marginBottom: tokens.spacing.lg,
  },
  listGroupHeader: {
    marginBottom: tokens.spacing.sm,
    fontFamily: tokens.fontFamily.semibold,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: tokens.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.xxl,
    borderTopRightRadius: tokens.radius.xxl,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
    maxHeight: '70%',
    flexShrink: 1,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.borderStrong,
    marginBottom: tokens.spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  sheetList: {
    flexGrow: 1,
    flexShrink: 1,
    marginBottom: tokens.spacing.md,
  },
});
