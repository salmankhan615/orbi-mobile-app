import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Modal, Pressable, ScrollView, SectionList, StyleSheet, View } from 'react-native';
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
import { CalendarSkeleton, EntityListSkeleton } from '@/components/custom/Skeletons';
import { EmptyState } from '@/components/custom/EmptyState';
import {
  formatWeekRange,
  getVisibleCalendarRange,
  getWeekRange,
  MONTH_NAMES,
  toISODate,
} from '@/utils/date';
import { useIsStaff, useHasPermission } from '@/hooks/useHasPermission';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { useToastStore } from '@/store/useToastStore';
import { smoothListProps, smoothScrollProps } from '@/utils/scroll';
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
  const canShifts = useHasPermission('view_shifts');
  const canViewBookings = useHasPermission('view_bookings');
  const canEditCalendar = useHasPermission('edit_calendar');
  const showToast = useToastStore((state) => state.show);
  const [, startViewTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);

  const range = useMemo(() => getVisibleCalendarRange(cursor), [cursor]);
  const { data: sessions, isLoading } = useSessions({
    calendarId: selectedCalendarId,
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const showInitialLoad = isLoading && !sessions;
  const { data: closedDays = [] } = useClosedDays();
  const closedDateSet = useMemo(() => new Set(closedDays), [closedDays]);

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
    const prefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-`;
    const dates = Array.from(sessionsByDate.keys())
      .filter((date) => date.startsWith(prefix))
      .sort();
    return dates.map((date) => ({
      date,
      data: sessionsByDate.get(date) ?? [],
    }));
  }, [sessionsByDate, cursor]);

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

  const handleSelectDate = useCallback(
    (iso: string) => {
      setSelectedDate(iso);
      if ((sessionsByDate.get(iso) ?? []).length > 0) {
        setSheetOpen(true);
      }
    },
    [sessionsByDate],
  );

  function handleViewMode(mode: ViewMode) {
    if (mode === viewMode) return;
    startViewTransition(() => setViewMode(mode));
  }

  function handleCalendarChange(calendarId: string) {
    setSelectedCalendarId(calendarId);
    setSheetOpen(false);
  }

  const openSession = useCallback(
    (session: Session) => {
      if (!isStaff) {
        navigation.navigate('SessionDetails', { sessionId: session.id });
        return;
      }
      if (session.kind === 'training') {
        if (!canViewBookings) {
          showToast("You don't have permission to view bookings for this location.", 'danger');
          return;
        }
        navigation.navigate('TrainingLocationBookings', {
          date: session.date,
          locationName: session.location || session.code || 'Location',
          locationId: session.locationId,
          dayId: session.dayId,
        });
        return;
      }
      if (canEditCalendar) {
        navigation.navigate('EditTimetable', { classId: session.id });
        return;
      }
      showToast("You don't have permission to edit this class.", 'danger');
    },
    [canEditCalendar, canViewBookings, isStaff, navigation, showToast],
  );

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text variant="heading">{isStaff ? 'Calendar' : 'My Calendar'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isStaff && (canShifts || canClose) ? (
        <View style={styles.staffActions}>
          {canShifts ? (
            <Button
              label="Shifts"
              icon="time-outline"
              variant="primary"
              onPress={() => navigation.navigate('PracticalShifts')}
              style={styles.staffActionBtn}
            />
          ) : null}
          {canClose ? (
            <Button
              label="Closures"
              icon="close-circle-outline"
              variant="primary"
              onPress={() => navigation.navigate('CloseCalendar')}
              style={styles.staffActionBtn}
            />
          ) : null}
        </View>
      ) : null}

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
              onPress={() => handleViewMode(mode)}
              hapticStyle="select"
              style={isActive ? [styles.segment, styles.segmentActive] : styles.segment}
            >
              <Text
                variant="bodySmall"
                color={isActive ? 'onSecondary' : 'textSecondary'}
                style={styles.segmentLabel}
              >
                {mode}
              </Text>
            </ScalePressable>
          );
        })}
      </View>

      {viewMode === 'List' ? (
        <SectionList
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
          sections={groupedForList}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          {...smoothListProps}
          renderSectionHeader={({ section }) => (
            <Text variant="bodySmall" color="textSecondary" style={styles.listGroupHeader}>
              {formatSessionDate(section.date)}
            </Text>
          )}
          renderItem={({ item }) => (
            <SessionListItem
              session={item}
              hideDate
              showChevron
              onPress={() => openSession(item)}
            />
          )}
          ListEmptyComponent={
            showInitialLoad ? (
              <CalendarSkeleton />
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="No sessions"
                message="Nothing in this calendar for the current period."
              />
            )
          }
        />
      ) : (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        {...smoothScrollProps}
      >
            <View style={styles.monthCard}>
              {viewMode === 'Month' ? (
                <MonthGrid
                  year={cursor.getFullYear()}
                  month={cursor.getMonth()}
                  selectedDate={selectedDate}
                  sessionsByDate={sessionsByDate}
                  closedDates={closedDateSet}
                  onSelectDate={handleSelectDate}
                />
              ) : (
                <WeekGrid
                  anchor={cursor}
                  selectedDate={selectedDate}
                  sessionsByDate={sessionsByDate}
                  closedDates={closedDateSet}
                  onSelectDate={handleSelectDate}
                />
              )}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={styles.legendBooked} />
                <Text variant="caption" color="textSecondary" style={styles.legendLabel}>
                  Booked
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendAvailable} />
                <Text variant="caption" color="textSecondary" style={styles.legendLabel}>
                  Available
                </Text>
              </View>
            </View>

            <Text variant="title" style={styles.sessionsHeader}>
              Sessions on {formatSessionDate(selectedDate)}
            </Text>

            {!isStaff ? (
              <Button
                label="Book Practical Training"
                icon="people-outline"
                variant="accent"
                onPress={() => navigation.navigate('BookTraining', { date: selectedDate })}
                style={styles.bookTrainingBtn}
              />
            ) : null}

            {showInitialLoad ? (
              <EntityListSkeleton rows={3} />
            ) : (
              <>
                {sessionsForSelectedDate.map((session) => (
                  <SessionListItem
                    key={session.id}
                    session={session}
                    onPress={() => openSession(session)}
                  />
                ))}

                {sessionsForSelectedDate.length === 0 && (
                  <EmptyState
                    icon="calendar-outline"
                    title="Free day"
                    message={`No sessions on this date${selectedCalendarId !== 'all' ? ` in ${selectedCalendar?.name}` : ''}.`}
                  />
                )}
              </>
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
      </ScrollView>
      )}

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
            {!isStaff ? (
              <Button
                label="Book Practical Training"
                icon="people-outline"
                variant="accent"
                onPress={() => {
                  setSheetOpen(false);
                  navigation.navigate('BookTraining', { date: selectedDate });
                }}
                style={styles.sheetBookTraining}
              />
            ) : null}
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
                    openSession(session);
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
  headerSpacer: {
    width: 40,
  },
  staffActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  staffActionBtn: {
    flex: 1,
    minHeight: 44,
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
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
    ...tokens.shadows.md,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendBooked: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: tokens.colors.success,
  },
  legendAvailable: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.secondary,
  },
  legendLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
  sessionsHeader: {
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.md,
  },
  bookTrainingBtn: {
    marginBottom: tokens.spacing.md,
  },
  viewFullDay: {
    marginTop: tokens.spacing.md,
  },
  listGroup: {
    marginBottom: tokens.spacing.lg,
  },
  listGroupHeader: {
    marginTop: tokens.spacing.md,
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
  sheetBookTraining: {
    marginBottom: tokens.spacing.md,
  },
  sheetList: {
    flexGrow: 1,
    flexShrink: 1,
    marginBottom: tokens.spacing.md,
  },
});
