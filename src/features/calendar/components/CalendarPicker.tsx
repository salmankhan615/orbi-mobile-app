import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/custom/ScalePressable';
import type { EventCalendar } from '@/api/calendars';

interface CalendarPickerProps {
  calendars: EventCalendar[];
  selectedId: string;
  onSelect: (calendarId: string) => void;
}

export function CalendarPicker({ calendars, selectedId, onSelect }: CalendarPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {calendars.map((calendar) => {
        const isActive = calendar.id === selectedId;
        const accent = tokens.colors[calendar.accentColor];

        return (
          <ScalePressable
            key={calendar.id}
            haptic={false}
            onPress={() => onSelect(calendar.id)}
            style={isActive ? [styles.chip, styles.chipActive] : styles.chip}
          >
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Text
              variant="bodySmall"
              color={isActive ? 'onSecondary' : 'textPrimary'}
              style={styles.label}
            >
              {calendar.name}
            </Text>
            {isActive ? (
              <Ionicons name="chevron-down" size={14} color={tokens.colors.onSecondary} />
            ) : null}
          </ScalePressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    marginBottom: tokens.spacing.sm,
  },
  row: {
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    paddingBottom: tokens.spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
  chipActive: {
    backgroundColor: tokens.colors.secondary,
    borderColor: tokens.colors.secondary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
