import { Pressable, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type { Session } from '@/api/sessions';
import { SESSION_TYPE_COLOR } from '../sessionStyle';
import { getWeekDays, isSameDay, WEEKDAY_LABELS } from '@/utils/date';

interface WeekGridProps {
  anchor: Date;
  selectedDate: string;
  sessionsByDate: Map<string, Session[]>;
  closedDates?: string[];
  onSelectDate: (iso: string) => void;
}

const DAY_CIRCLE = 32;

export function WeekGrid({
  anchor,
  selectedDate,
  sessionsByDate,
  closedDates = [],
  onSelectDate,
}: WeekGridProps) {
  const days = getWeekDays(anchor);
  const today = new Date();

  return (
    <View style={styles.root}>
      {days.map((day) => {
        const daySessions = sessionsByDate.get(day.iso) ?? [];
        const isSelected = day.iso === selectedDate;
        const isClosed = closedDates.includes(day.iso);
        const isToday = isSameDay(day.iso, today);

        return (
          <Pressable key={day.iso} style={styles.dayCol} onPress={() => onSelectDate(day.iso)}>
            <Text variant="caption" color="textMuted" style={styles.weekday}>
              {WEEKDAY_LABELS[day.date.getDay()]}
            </Text>
            <View
              style={[
                styles.dayCircle,
                isToday && !isSelected && styles.dayCircleToday,
                isClosed && styles.dayCircleClosed,
                isSelected && styles.dayCircleSelected,
              ]}
            >
              <Text
                variant="bodySmall"
                color={isSelected ? 'onPrimary' : 'textPrimary'}
                style={isSelected ? styles.daySelectedLabel : undefined}
              >
                {day.date.getDate()}
              </Text>
            </View>
            <View style={styles.events}>
              {daySessions.slice(0, 3).map((session) => (
                <View
                  key={session.id}
                  style={[
                    styles.eventPill,
                    { backgroundColor: tokens.colors[SESSION_TYPE_COLOR[session.type]] },
                  ]}
                >
                  <Text
                    variant="caption"
                    color="onPrimary"
                    numberOfLines={1}
                    style={styles.eventText}
                  >
                    {session.title}
                  </Text>
                </View>
              ))}
              {daySessions.length > 3 ? (
                <Text variant="caption" color="textMuted" style={styles.more}>
                  +{daySessions.length - 3}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
  },
  dayCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingBottom: tokens.spacing.xs,
  },
  weekday: {
    fontFamily: tokens.fontFamily.semibold,
  },
  dayCircle: {
    width: DAY_CIRCLE,
    height: DAY_CIRCLE,
    borderRadius: DAY_CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: tokens.colors.secondary,
  },
  dayCircleSelected: {
    backgroundColor: tokens.colors.secondary,
  },
  dayCircleClosed: {
    backgroundColor: tokens.colors.tertiaryMuted,
  },
  daySelectedLabel: {
    fontFamily: tokens.fontFamily.bold,
  },
  events: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
    minHeight: 36,
  },
  eventPill: {
    width: '100%',
    borderRadius: tokens.radius.sm,
    paddingHorizontal: 2,
    paddingVertical: 1,
    alignItems: 'center',
  },
  eventText: {
    fontSize: tokens.fontSize.xs,
    fontFamily: tokens.fontFamily.medium,
  },
  more: {
    fontFamily: tokens.fontFamily.medium,
  },
});
