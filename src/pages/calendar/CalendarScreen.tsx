import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/custom/Screen';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { useSessions } from '@/queries/useSessions';
import type { Session } from '@/api/sessions';
import { MonthGrid } from '@/features/calendar/components/MonthGrid';
import { SessionListItem } from '@/features/calendar/components/SessionListItem';
import { MONTH_NAMES, toISODate } from '@/utils/date';
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

export function CalendarScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data: sessions } = useSessions();
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [cursor, setCursor] = useState(() => new Date(2026, 7, 1));
  const [selectedDate, setSelectedDate] = useState(sessions?.[0]?.date ?? toISODate(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);

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

  function changeMonth(delta: number) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function goToday() {
    const today = new Date(2026, 7, 4);
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toISODate(today));
  }

  function handleSelectDate(iso: string) {
    setSelectedDate(iso);
    if ((sessionsByDate.get(iso) ?? []).length > 0) {
      setSheetOpen(true);
    }
  }

  return (
    <Screen style={styles.screen} background="surface">
      <View style={styles.header}>
        <Text variant="heading">My Calendar</Text>
        <IconButton name="add" background="surfaceAlt" />
      </View>

      <View style={styles.controls}>
        <View style={styles.monthNav}>
          <IconButton name="chevron-back" onPress={() => changeMonth(-1)} />
          <Text variant="title">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </Text>
          <IconButton name="chevron-forward" onPress={() => changeMonth(1)} />
        </View>
        <ScalePressable onPress={goToday} haptic={false} style={styles.todayBtn}>
          <Text variant="caption" color="success" style={styles.todayLabel}>
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
              haptic={false}
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode !== 'List' && (
          <>
            <View style={styles.monthCard}>
              <MonthGrid
                year={cursor.getFullYear()}
                month={cursor.getMonth()}
                selectedDate={selectedDate}
                sessionsByDate={sessionsByDate}
                onSelectDate={handleSelectDate}
              />
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
              </Text>
            )}

            {sessionsForSelectedDate.length > 0 && (
              <Button
                label="View Full Day  →"
                onPress={() => navigation.navigate('DayAgenda', { date: selectedDate })}
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
            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
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
                navigation.navigate('DayAgenda', { date: selectedDate });
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
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
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
  },
  todayBtn: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.successMuted,
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
    backgroundColor: tokens.colors.success,
  },
  segmentLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  content: {
    paddingBottom: tokens.spacing.xxxl,
  },
  monthCard: {
    backgroundColor: tokens.colors.surfaceAlt,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
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
    marginBottom: tokens.spacing.md,
  },
});
