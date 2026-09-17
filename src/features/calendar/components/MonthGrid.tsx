import { Pressable, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type { Session } from '@/api/sessions';
import { daySessionMarkers } from '../sessionStyle';
import { getMonthGrid, isSameDay, WEEKDAY_LABELS } from '@/utils/date';

interface MonthGridProps {
  year: number;
  month: number;
  selectedDate: string;
  sessionsByDate: Map<string, Session[]>;
  closedDates?: string[];
  onSelectDate: (iso: string) => void;
}

export function MonthGrid({
  year,
  month,
  selectedDate,
  sessionsByDate,
  closedDates = [],
  onSelectDate,
}: MonthGridProps) {
  const today = new Date();
  const days = getMonthGrid(year, month);
  const weeks = Array.from({ length: days.length / 7 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} variant="caption" color="textMuted" style={styles.weekdayCell}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0]?.iso} style={styles.daysRow}>
          {week.map((day) => {
            const isSelected = day.iso === selectedDate;
            const isClosed = closedDates.includes(day.iso);
            const daySessions = sessionsByDate.get(day.iso) ?? [];
            const { hasBooked, availableCount } = daySessionMarkers(daySessions);
            const isToday = isSameDay(day.iso, today);
            const availableDots = Math.min(availableCount, 3);

            return (
              <Pressable key={day.iso} style={styles.dayCell} onPress={() => onSelectDate(day.iso)}>
                <View
                  style={[
                    styles.dayCircle,
                    isToday && !isSelected && !hasBooked && styles.dayCircleToday,
                    hasBooked && !isSelected && styles.dayCircleBooked,
                    isClosed && styles.dayCircleClosed,
                    isSelected && styles.dayCircleSelected,
                  ]}
                >
                  <Text
                    variant="bodySmall"
                    color={
                      isSelected ? 'onSecondary' : day.isCurrentMonth ? 'textPrimary' : 'textMuted'
                    }
                    style={isSelected ? styles.daySelectedLabel : undefined}
                  >
                    {day.date.getDate()}
                  </Text>
                </View>
                <View style={styles.dotsRow}>
                  {Array.from({ length: availableDots }, (_, index) => (
                    <View key={`${day.iso}-dot-${index}`} style={styles.dot} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    textAlign: 'center',
    fontFamily: tokens.fontFamily.semibold,
  },
  daysRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    minHeight: CELL_SIZE + 12,
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: tokens.colors.secondary,
  },
  dayCircleBooked: {
    borderWidth: 2,
    borderColor: tokens.colors.success,
  },
  dayCircleSelected: {
    backgroundColor: tokens.colors.secondary,
    ...tokens.shadows.sm,
  },
  dayCircleClosed: {
    backgroundColor: tokens.colors.tertiaryMuted,
  },
  daySelectedLabel: {
    fontFamily: tokens.fontFamily.bold,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 6,
    marginTop: tokens.spacing.xs,
    paddingBottom: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: tokens.colors.secondary,
  },
});
