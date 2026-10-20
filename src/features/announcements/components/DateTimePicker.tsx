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

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown when empty. */
  emptyLabel?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Parse `YYYY-MM-DDTHH:mm` or any Date-parseable string into local date + clock. */
function splitValue(value: string): { date: string; hour: number; minute: number } {
  const now = new Date();
  const fallback = {
    date: toISODate(now),
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
  if (!value.trim()) return fallback;

  const compact = value.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{1,2}):(\d{2})/);
  if (compact) {
    return {
      date: compact[1],
      hour: Math.min(23, Math.max(0, Number(compact[2]))),
      minute: Math.min(59, Math.max(0, Number(compact[3]))),
    };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return {
    date: toISODate(parsed),
    hour: parsed.getHours(),
    minute: parsed.getMinutes(),
  };
}

function toValue(date: string, hour: number, minute: number): string {
  return `${date}T${pad2(hour)}:${pad2(minute)}`;
}

function displayValue(value: string): string {
  if (!value.trim()) return '';
  const { date, hour, minute } = splitValue(value);
  return `${formatPortalDate(date)} · ${pad2(hour)}:${pad2(minute)}`;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  emptyLabel = 'Optional — tap to set',
}: DateTimePickerProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const today = toISODate(new Date());
  const initial = splitValue(value);
  const [cursor, setCursor] = useState({
    year: Number(initial.date.slice(0, 4)),
    month: Number(initial.date.slice(5, 7)) - 1,
  });
  const [draftDate, setDraftDate] = useState(initial.date);
  const [draftHour, setDraftHour] = useState(initial.hour);
  const [draftMinute, setDraftMinute] = useState(initial.minute);

  function openPicker() {
    const next = splitValue(value);
    setDraftDate(next.date);
    setDraftHour(next.hour);
    setDraftMinute(next.minute);
    setCursor({
      year: Number(next.date.slice(0, 4)),
      month: Number(next.date.slice(5, 7)) - 1,
    });
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

  function bumpHour(delta: number) {
    setDraftHour((prev) => (prev + delta + 24) % 24);
  }

  function bumpMinute(delta: number) {
    setDraftMinute((prev) => {
      const next = prev + delta;
      if (next >= 60) return 0;
      if (next < 0) return 45;
      return next;
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
            {value.trim() ? displayValue(value) : emptyLabel}
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
                  const selected = day.iso === draftDate;
                  const isToday = day.iso === today;
                  return (
                    <ScalePressable
                      key={day.iso}
                      hapticStyle="select"
                      onPress={() => setDraftDate(day.iso)}
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

            <View style={styles.timeBlock}>
              <Text variant="caption" color="textMuted" style={styles.timeLabel}>
                Time
              </Text>
              <View style={styles.timeRow}>
                <TimeStepper value={pad2(draftHour)} onDecrement={() => bumpHour(-1)} onIncrement={() => bumpHour(1)} />
                <Text variant="title" style={styles.timeColon}>
                  :
                </Text>
                <TimeStepper
                  value={pad2(draftMinute)}
                  onDecrement={() => bumpMinute(-15)}
                  onIncrement={() => bumpMinute(15)}
                />
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                label="Clear"
                variant="outline"
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
                style={styles.actionBtn}
              />
              <Button
                label="Done"
                onPress={() => {
                  onChange(toValue(draftDate, draftHour, draftMinute));
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

function TimeStepper({
  value,
  onDecrement,
  onIncrement,
}: {
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <IconButton name="remove" onPress={onDecrement} />
      <Text variant="title" style={styles.stepperValue}>
        {value}
      </Text>
      <IconButton name="add" onPress={onIncrement} />
    </View>
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
    marginBottom: tokens.spacing.md,
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
  timeBlock: {
    marginTop: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  timeLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
  },
  timeColon: {
    marginBottom: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xs,
  },
  stepperValue: {
    minWidth: 40,
    textAlign: 'center',
    fontFamily: tokens.fontFamily.semibold,
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
