import { useEffect, useMemo, useState } from 'react';
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

export type DateRange = {
  startDate: string;
  endDate: string;
};

interface DateRangePickerProps {
  label?: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function normalizeRange(range: DateRange): DateRange {
  const start = range.startDate || range.endDate;
  const end = range.endDate || range.startDate;
  if (!start || !end) {
    const today = toISODate(new Date());
    return { startDate: today, endDate: today };
  }
  if (start <= end) return { startDate: start, endDate: end };
  return { startDate: end, endDate: start };
}

export function summarizeDateRange(range: DateRange): string {
  const { startDate, endDate } = normalizeRange(range);
  const today = toISODate(new Date());
  if (startDate === endDate) {
    return startDate === today ? 'Today' : formatPortalDate(startDate);
  }
  return `${formatPortalDate(startDate)} – ${formatPortalDate(endDate)}`;
}

export function DateRangePicker({
  label = 'Date range',
  value,
  onChange,
}: DateRangePickerProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const today = toISODate(new Date());
  const applied = normalizeRange(value);
  const seedDate = new Date(`${applied.startDate}T12:00:00`);
  const [cursor, setCursor] = useState({
    year: seedDate.getFullYear(),
    month: seedDate.getMonth(),
  });
  const [draftStart, setDraftStart] = useState(applied.startDate);
  const [draftEnd, setDraftEnd] = useState(applied.endDate);
  /** After choosing start, next tap sets end. */
  const [pickingEnd, setPickingEnd] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = normalizeRange(value);
    setDraftStart(next.startDate);
    setDraftEnd(next.endDate);
    setPickingEnd(false);
    const date = new Date(`${next.startDate}T12:00:00`);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
  }, [open, value]);

  const days = useMemo(
    () => getMonthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );
  const weeks = useMemo(
    () => Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    [days],
  );

  const rangeStart = draftStart <= draftEnd ? draftStart : draftEnd;
  const rangeEnd = draftStart <= draftEnd ? draftEnd : draftStart;

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function selectDay(iso: string) {
    if (!pickingEnd) {
      setDraftStart(iso);
      setDraftEnd(iso);
      setPickingEnd(true);
      return;
    }
    setDraftEnd(iso);
    setPickingEnd(false);
  }

  function apply() {
    onChange(normalizeRange({ startDate: draftStart, endDate: draftEnd }));
    setOpen(false);
  }

  return (
    <>
      <ScalePressable hapticStyle="select" onPress={() => setOpen(true)} style={styles.trigger}>
        <View style={styles.triggerCopy}>
          <Text variant="caption" color="textMuted">
            {label}
          </Text>
          <Text variant="bodySmall" style={styles.triggerValue} numberOfLines={1}>
            {summarizeDateRange(value)}
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
            <View style={styles.handle} />
            <Text variant="title" style={styles.sheetTitle}>
              Select date range
            </Text>
            <Text variant="caption" color="textMuted" style={styles.hint}>
              {pickingEnd
                ? 'Tap an end date to finish the range.'
                : 'Tap a start date, then an end date.'}
            </Text>

            <View style={styles.rangeLabels}>
              <View style={styles.rangeBox}>
                <Text variant="caption" color="textMuted">
                  From
                </Text>
                <Text variant="bodySmall" style={styles.rangeValue}>
                  {formatPortalDate(rangeStart)}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={tokens.colors.textMuted} />
              <View style={styles.rangeBox}>
                <Text variant="caption" color="textMuted">
                  To
                </Text>
                <Text variant="bodySmall" style={styles.rangeValue}>
                  {formatPortalDate(rangeEnd)}
                </Text>
              </View>
            </View>

            <View style={styles.monthNav}>
              <IconButton name="chevron-back" onPress={() => shiftMonth(-1)} />
              <Text variant="bodySmall" style={styles.monthLabel}>
                {MONTH_NAMES[cursor.month]} {cursor.year}
              </Text>
              <IconButton name="chevron-forward" onPress={() => shiftMonth(1)} />
            </View>

            <View style={styles.weekRow}>
              {WEEKDAY_LABELS.map((weekday) => (
                <Text key={weekday} variant="caption" color="textMuted" style={styles.weekday}>
                  {weekday}
                </Text>
              ))}
            </View>

            {weeks.map((week) => (
              <View key={week[0]?.iso} style={styles.daysRow}>
                {week.map((day) => {
                  const isStart = day.iso === rangeStart;
                  const isEnd = day.iso === rangeEnd;
                  const inRange = day.iso >= rangeStart && day.iso <= rangeEnd;
                  const isToday = day.iso === today;
                  return (
                    <ScalePressable
                      key={day.iso}
                      haptic={false}
                      onPress={() => selectDay(day.iso)}
                      style={[
                        styles.dayCell,
                        !day.isCurrentMonth && styles.dayOutside,
                        inRange && styles.dayInRange,
                        (isStart || isEnd) && styles.dayEndpoint,
                        isToday && !inRange && styles.dayToday,
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={
                          isStart || isEnd
                            ? 'onSecondary'
                            : day.isCurrentMonth
                              ? 'textPrimary'
                              : 'textMuted'
                        }
                        style={styles.dayLabel}
                      >
                        {day.date.getDate()}
                      </Text>
                    </ScalePressable>
                  );
                })}
              </View>
            ))}

            <View style={styles.actions}>
              <Button
                label="Today"
                variant="outline"
                onPress={() => {
                  setDraftStart(today);
                  setDraftEnd(today);
                  setPickingEnd(false);
                }}
                style={styles.actionBtn}
              />
              <Button label="Apply" onPress={apply} style={styles.actionBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    ...tokens.shadows.sm,
  },
  triggerCopy: {
    flex: 1,
    gap: 2,
  },
  triggerValue: {
    fontFamily: tokens.fontFamily.medium,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 21, 40, 0.45)',
  },
  sheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
  },
  sheetTitle: {
    marginBottom: tokens.spacing.xs,
  },
  hint: {
    marginBottom: tokens.spacing.md,
  },
  rangeLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  rangeBox: {
    flex: 1,
    gap: 2,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surfaceAlt,
  },
  rangeValue: {
    fontFamily: tokens.fontFamily.medium,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  monthLabel: {
    fontFamily: tokens.fontFamily.semibold,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.xs,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 44,
    marginHorizontal: 1,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOutside: {
    opacity: 0.45,
  },
  dayInRange: {
    backgroundColor: tokens.colors.secondaryMuted,
  },
  dayEndpoint: {
    backgroundColor: tokens.colors.secondary,
  },
  dayToday: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.secondary,
  },
  dayLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
  },
});
