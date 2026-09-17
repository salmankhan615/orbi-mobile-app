import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { IconButton } from '@/components/ui/IconButton';
import {
  formatPortalDate,
  getMonthGrid,
  MONTH_NAMES,
  toISODate,
  WEEKDAY_LABELS,
} from '@/utils/date';

interface DueDatePickerProps {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
}

export function DueDatePicker({ label = 'Due date', value, onChange }: DueDatePickerProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const today = toISODate(new Date());
  const seed = value || today;
  const seedDate = new Date(`${seed}T12:00:00`);
  const [cursor, setCursor] = useState({
    year: seedDate.getFullYear(),
    month: seedDate.getMonth(),
  });
  const [draft, setDraft] = useState(seed);

  function openPicker() {
    const next = value || today;
    const date = new Date(`${next}T12:00:00`);
    setDraft(next);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
    setOpen(true);
  }

  const days = useMemo(() => getMonthGrid(cursor.year, cursor.month), [cursor.year, cursor.month]);
  const weeks = useMemo(
    () =>
      Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    [days],
  );

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  return (
    <>
      <ScalePressable hapticStyle="select" onPress={openPicker} style={styles.row}>
        <View style={styles.copy}>
          <Text variant="caption" color="textMuted">
            {label}
          </Text>
          <Text variant="bodySmall" style={styles.value}>
            {value ? formatPortalDate(value) : 'Select a date'}
          </Text>
        </View>
        <Ionicons name="calendar-outline" size={18} color={tokens.colors.textMuted} />
      </ScalePressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.monthRow}>
              <IconButton name="chevron-back" onPress={() => shiftMonth(-1)} />
              <Text variant="title">
                {MONTH_NAMES[cursor.month]} {cursor.year}
              </Text>
              <IconButton name="chevron-forward" onPress={() => shiftMonth(1)} />
            </View>

            <View style={styles.weekRow}>
              {WEEKDAY_LABELS.map((day) => (
                <Text key={day} variant="caption" color="textMuted" style={styles.weekday}>
                  {day.slice(0, 1)}
                </Text>
              ))}
            </View>

            {weeks.map((week) => (
              <View key={week[0]?.iso} style={styles.weekRow}>
                {week.map((day) => {
                  const selected = day.iso === draft;
                  const isToday = day.iso === today;
                  return (
                    <ScalePressable
                      key={day.iso}
                      hapticStyle="select"
                      onPress={() => setDraft(day.iso)}
                      style={styles.dayCell}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          isToday && !selected && styles.dayToday,
                          selected && styles.daySelected,
                        ]}
                      >
                        <Text
                          variant="caption"
                          color={
                            selected
                              ? 'onPrimary'
                              : day.isCurrentMonth
                                ? 'textPrimary'
                                : 'textMuted'
                          }
                        >
                          {day.date.getDate()}
                        </Text>
                      </View>
                    </ScalePressable>
                  );
                })}
              </View>
            ))}

            <View style={styles.actions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setOpen(false)}
                style={styles.actionBtn}
              />
              <Button
                label="Done"
                onPress={() => {
                  onChange(draft);
                  setOpen(false);
                }}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  value: {
    fontFamily: tokens.fontFamily.semibold,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: tokens.colors.overlay,
  },
  sheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.xxl,
    borderTopRightRadius: tokens.radius.xxl,
    paddingTop: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    ...tokens.shadows.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.borderStrong,
    marginBottom: tokens.spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.primary,
  },
  daySelected: {
    backgroundColor: tokens.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
});
