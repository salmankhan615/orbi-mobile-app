import { Pressable, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type { Session } from '@/api/sessions';
import { SESSION_TYPE_COLOR } from '../sessionStyle';
import { getMonthGrid, WEEKDAY_LABELS } from '@/utils/date';

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
  const days = getMonthGrid(year, month);

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} variant="caption" color="textMuted" style={styles.weekdayCell}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const isSelected = day.iso === selectedDate;
          const isClosed = closedDates.includes(day.iso);
          const daySessions = sessionsByDate.get(day.iso) ?? [];

          return (
            <Pressable key={day.iso} style={styles.dayCell} onPress={() => onSelectDate(day.iso)}>
              <View
                style={[
                  styles.dayCircle,
                  isClosed && styles.dayCircleClosed,
                  isSelected && styles.dayCircleSelected,
                ]}
              >
                <Text
                  variant="bodySmall"
                  color={
                    isSelected ? 'onPrimary' : day.isCurrentMonth ? 'textPrimary' : 'textMuted'
                  }
                  style={isSelected ? styles.daySelectedLabel : undefined}
                >
                  {day.date.getDate()}
                </Text>
              </View>
              <View style={styles.dotsRow}>
                {daySessions.slice(0, 3).map((session) => (
                  <View
                    key={session.id}
                    style={[
                      styles.dot,
                      { backgroundColor: tokens.colors[SESSION_TYPE_COLOR[session.type]] },
                    ]}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
