import { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { Badge } from '@/components/ui/Badge';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { DueDatePicker } from '@/features/coursework/components/DueDatePicker';
import { formatClosureDetails, type CalendarClosure, type ClosureScope } from '@/api/staff';
import { useCalendars } from '@/queries/useCalendars';
import { useAddClosure, useClosures, useDeleteClosure } from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import { toISODate } from '@/utils/date';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'CloseCalendar'>;

const WEEKDAY_OPTIONS = [
  { id: '0', label: 'Sunday' },
  { id: '1', label: 'Monday' },
  { id: '2', label: 'Tuesday' },
  { id: '3', label: 'Wednesday' },
  { id: '4', label: 'Thursday' },
  { id: '5', label: 'Friday' },
  { id: '6', label: 'Saturday' },
];

type ClosureType = 'once' | 'weekly';

function ChipRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <ScalePressable
            key={option.id}
            haptic={false}
            onPress={() => onChange(option.id)}
            style={active ? styles.chipActive : styles.chip}
          >
            <Text variant="caption" color={active ? 'onSecondary' : 'textSecondary'}>
              {option.label}
            </Text>
          </ScalePressable>
        );
      })}
    </View>
  );
}

function closureSubtitle(item: CalendarClosure, calendarLabel?: string) {
  const parts = [
    item.scope === 'global' ? 'Global' : calendarLabel || item.calendarName || 'Calendar',
    item.reason || undefined,
  ];
  return parts.filter(Boolean).join(' · ');
}

function weekdayFromIso(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return String(Number.isNaN(date.getTime()) ? new Date().getDay() : date.getDay());
}

export function CloseCalendarScreen({ route, navigation }: Props) {
  const allowed = useHasPermission('close_calendar');
  const { data: closures = [], isLoading } = useClosures();
  const { data: calendars } = useCalendars();
  const addClosure = useAddClosure();
  const deleteClosure = useDeleteClosure();
  const showToast = useToastStore((state) => state.show);
  const initialDate = route.params?.date ?? toISODate(new Date());
  const fromCalendarDay = Boolean(route.params?.date);

  const calendarOptions = useMemo(
    () =>
      (calendars ?? [])
        .filter((calendar) => calendar.id !== 'all')
        .map((calendar) => ({ id: calendar.id, label: calendar.name })),
    [calendars],
  );
  const calendarNameById = useMemo(
    () => Object.fromEntries(calendarOptions.map((item) => [item.id, item.label])),
    [calendarOptions],
  );

  const [scope, setScope] = useState<ClosureScope>('global');
  const [calendarId, setCalendarId] = useState('');
  const [type, setType] = useState<ClosureType>('once');
  const [date, setDate] = useState(initialDate);
  const [weekday, setWeekday] = useState(() => weekdayFromIso(initialDate));
  const [reason, setReason] = useState('');
  const [filterCalendarId, setFilterCalendarId] = useState('all');

  const visibleClosures = useMemo(() => {
    if (filterCalendarId === 'all') return closures;
    return closures.filter(
      (item) => item.scope === 'global' || item.calendarId === filterCalendarId,
    );
  }, [closures, filterCalendarId]);

  function resetForm() {
    setScope('global');
    setCalendarId('');
    setType('once');
    setDate(toISODate(new Date()));
    setWeekday(String(new Date().getDay()));
    setReason('');
  }

  function save() {
    if (scope === 'calendar' && !calendarId) {
      showToast('Select a calendar', 'danger');
      return;
    }
    if (type === 'once' && !date) {
      showToast('Select a date', 'danger');
      return;
    }
    if (type === 'weekly' && weekday === '') {
      showToast('Select a day of week', 'danger');
      return;
    }

    addClosure.mutate(
      {
        scope,
        calendarId: scope === 'calendar' ? calendarId : undefined,
        permanent: type === 'weekly',
        date: type === 'once' ? date : undefined,
        dayOfWeek: type === 'weekly' ? Number(weekday) : undefined,
        reason,
      },
      {
        onSuccess: () => {
          haptics.success();
          showToast('Day closure added', 'success');
          if (fromCalendarDay) {
            navigation.goBack();
            return;
          }
          resetForm();
        },
        onError: (error) => {
          haptics.warning();
          showToast(error instanceof Error ? error.message : 'Failed to add closure', 'danger');
        },
      },
    );
  }

  function confirmDelete(item: CalendarClosure) {
    Alert.alert('Delete closure', 'Are you sure you want to delete this closure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteClosure.mutate(item.id, {
            onSuccess: () => {
              haptics.success();
              showToast('Closure deleted', 'success');
            },
            onError: (error) => {
              haptics.warning();
              showToast(
                error instanceof Error ? error.message : 'Failed to delete closure',
                'danger',
              );
            },
          });
        },
      },
    ]);
  }

  if (!allowed) {
    return (
      <StackScreen title="Day closures">
        <Text variant="body" color="textMuted">
          You do not have permission to close calendar days.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title={fromCalendarDay ? 'Close day' : 'Day closures'} keyboardAvoiding>
      <Text variant="body" color="textSecondary" style={styles.copy}>
        Closed days cannot take new class or training bookings.
      </Text>

      {fromCalendarDay ? null : (
        <Text variant="title" style={styles.section}>
          Close day
        </Text>
      )}
      <Text variant="caption" color="textMuted" style={styles.fieldLabel}>
        Scope
      </Text>
      <ChipRow
        value={scope}
        options={[
          { id: 'global', label: 'Global (all calendars)' },
          { id: 'calendar', label: 'Specific calendar' },
        ]}
        onChange={setScope}
      />
      {scope === 'calendar' ? (
        <SelectDropdown
          label="Calendar"
          required
          placeholder="Choose…"
          value={calendarId || null}
          options={calendarOptions}
          onChange={setCalendarId}
          emptyMessage="No calendars available."
        />
      ) : null}

      <Text variant="caption" color="textMuted" style={styles.fieldLabel}>
        Type
      </Text>
      <ChipRow
        value={type}
        options={[
          { id: 'once', label: 'One-time date' },
          { id: 'weekly', label: 'Permanent weekly' },
        ]}
        onChange={setType}
      />
      {type === 'weekly' ? (
        <SelectDropdown
          label="Day of week"
          required
          value={weekday}
          options={WEEKDAY_OPTIONS}
          onChange={setWeekday}
        />
      ) : (
        <DueDatePicker label="Date" value={date} onChange={setDate} />
      )}
      <Text variant="caption" color="textMuted" style={styles.fieldLabel}>
        Reason
      </Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="e.g., Holiday, Maintenance"
        placeholderTextColor={tokens.colors.textMuted}
        multiline
        textAlignVertical="top"
        style={styles.reason}
      />
      <Button
        label={addClosure.isPending ? 'Saving…' : 'Save'}
        onPress={save}
        loading={addClosure.isPending}
        disabled={addClosure.isPending}
      />

      {fromCalendarDay ? null : (
        <>
          <Text variant="title" style={styles.section}>
            Existing closures
          </Text>
          <SelectDropdown
            label="Filter by calendar"
            value={filterCalendarId}
            options={[{ id: 'all', label: 'All calendars' }, ...calendarOptions]}
            onChange={setFilterCalendarId}
          />
          {isLoading ? (
            <EntityListSkeleton rows={3} />
          ) : visibleClosures.length === 0 ? (
            <Text variant="bodySmall" color="textMuted">
              No closures.
            </Text>
          ) : (
            visibleClosures.map((item) => (
              <ScalePressable key={item.id} onPress={() => confirmDelete(item)} style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text variant="bodySmall" style={styles.rowTitle}>
                    {formatClosureDetails(item)}
                  </Text>
                  <Text variant="caption" color="textMuted" numberOfLines={2}>
                    {closureSubtitle(
                      item,
                      item.calendarId ? calendarNameById[item.calendarId] : undefined,
                    )}
                  </Text>
                </View>
                <View style={styles.rowBadges}>
                  <Badge
                    label={item.scope === 'global' ? 'Global' : 'Calendar'}
                    tone={item.scope === 'global' ? 'primary' : 'success'}
                  />
                  <Badge
                    label={item.permanent ? 'Permanent' : 'One-time'}
                    tone={item.permanent ? 'warning' : 'info'}
                  />
                </View>
              </ScalePressable>
            ))
          )}
        </>
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    marginBottom: tokens.spacing.lg,
  },
  section: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  fieldLabel: {
    marginBottom: tokens.spacing.sm,
    fontFamily: tokens.fontFamily.semibold,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
  chipActive: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.secondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.secondary,
  },
  reason: {
    minHeight: 72,
    marginBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fontFamily.regular,
    fontSize: tokens.fontSize.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  rowBadges: {
    alignItems: 'flex-end',
    gap: tokens.spacing.xs,
  },
});
