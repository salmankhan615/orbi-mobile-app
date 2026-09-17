import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { Spinner } from '@/components/ui/Spinner';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FilterSelectRow } from '@/features/bookings/components/BookingFilters';
import {
  useCreatePracticalShift,
  usePracticalShifts,
  useUpdatePracticalShift,
} from '@/queries/useStaff';
import { useTrainingLocations } from '@/queries/useBookings';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'ShiftEditor'>;

const DAYS = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
] as const;

const ACCESS_TYPES = ['Online', 'Hybrid', 'Center'] as const;

const DEFAULT_COLOR = '#3788d8';

function normalizeClock(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) return trimmed;
  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3]?.toLowerCase();
  if (meridiem) {
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
  }
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return trimmed;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

export function ShiftEditorScreen({ route, navigation }: Props) {
  const shiftId = route.params.shiftId;
  const isEdit = Boolean(shiftId);
  const allowed = useHasPermission('view_shifts');
  const { data: locations = [], isLoading: loadingLocations } = useTrainingLocations();
  const { data: shifts, isLoading: loadingShifts } = usePracticalShifts();
  const create = useCreatePracticalShift();
  const update = useUpdatePracticalShift();
  const showToast = useToastStore((state) => state.show);

  const existing = useMemo(
    () => (shiftId ? (shifts ?? []).find((item) => item.id === shiftId) : undefined),
    [shiftId, shifts],
  );

  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [bookingLimit, setBookingLimit] = useState('15');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [isActive, setIsActive] = useState(true);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [accessTypes, setAccessTypes] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!existing || seeded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds edit form once the shift loads
    setName(existing.name);
    setLocationId(existing.locationId);
    setStartTime(existing.startTime);
    setEndTime(existing.endTime);
    setBookingLimit(String(existing.defaultBookingLimit));
    setColor(existing.color || DEFAULT_COLOR);
    setIsActive(existing.isActive);
    setDaysOfWeek(existing.daysOfWeek);
    setAccessTypes(existing.allowedAccessTypes);
    setSeeded(true);
  }, [existing, seeded]);

  const locationOptions = useMemo(
    () => locations.map((item) => ({ id: item.id, label: item.title })),
    [locations],
  );

  const statusOptions = [
    { id: 'true', label: 'Active' },
    { id: 'false', label: 'Inactive' },
  ];

  const saving = create.isPending || update.isPending;

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day].sort((a, b) => a - b),
    );
  }

  function toggleAccess(type: string) {
    setAccessTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  }

  function save() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('Shift name is required', 'danger');
      return;
    }
    if (!locationId) {
      showToast('Select a location', 'danger');
      return;
    }
    const start = normalizeClock(startTime);
    const end = normalizeClock(endTime);
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      showToast('Use HH:MM for start and end times', 'danger');
      return;
    }
    const limit = Number(bookingLimit);
    if (!Number.isFinite(limit) || limit < 1) {
      showToast('Booking limit must be at least 1', 'danger');
      return;
    }
    const hex = color.trim() || DEFAULT_COLOR;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      showToast('Color must be a hex value like #3788d8', 'danger');
      return;
    }

    const payload = {
      name: trimmedName,
      startTime: start,
      endTime: end,
      location: locationId,
      defaultBookingLimit: limit,
      color: hex,
      daysOfWeek,
      allowedAccessTypes: accessTypes,
      isActive,
    };

    if (isEdit && shiftId) {
      update.mutate(
        { shiftId, payload },
        {
          onSuccess: () => {
            haptics.success();
            showToast('Shift updated', 'success');
            navigation.goBack();
          },
          onError: () => {
            haptics.warning();
            showToast('Could not update shift', 'danger');
          },
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: () => {
        haptics.success();
        showToast('Shift created', 'success');
        navigation.goBack();
      },
      onError: () => {
        haptics.warning();
        showToast('Could not create shift', 'danger');
      },
    });
  }

  if (!allowed) {
    return (
      <StackScreen title="Shifts">
        <Text variant="body" color="textMuted">
          You do not have permission to manage practical training shifts.
        </Text>
      </StackScreen>
    );
  }

  if (isEdit && (loadingShifts || loadingLocations) && !existing) {
    return (
      <StackScreen title="Edit shift">
        <Spinner fill label="Loading shift…" />
      </StackScreen>
    );
  }

  if (isEdit && !loadingShifts && !existing) {
    return (
      <StackScreen title="Edit shift">
        <Text variant="body" color="textMuted">
          This shift could not be found.
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title={isEdit ? 'Edit shift' : 'Create new shift'} keyboardAvoiding>
      <TextField
        label="Shift name *"
        value={name}
        onChangeText={setName}
        placeholder="e.g., Morning Shift"
        autoCapitalize="words"
      />

      <View style={styles.fieldBlock}>
        <FilterSelectRow
          label="Location *"
          value={locationId}
          options={
            locationOptions.length > 0
              ? locationOptions
              : [{ id: '', label: loadingLocations ? 'Loading…' : 'No locations' }]
          }
          onChange={setLocationId}
        />
      </View>

      <TextField
        label="Start time *"
        value={startTime}
        onChangeText={setStartTime}
        placeholder="10:00"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField
        label="End time *"
        value={endTime}
        onChangeText={setEndTime}
        placeholder="14:00"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField
        label="Booking limit *"
        value={bookingLimit}
        onChangeText={setBookingLimit}
        placeholder="15"
        keyboardType="number-pad"
      />
      <TextField
        label="Shift color"
        value={color}
        onChangeText={setColor}
        placeholder={DEFAULT_COLOR}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.fieldBlock}>
        <FilterSelectRow
          label="Status"
          value={isActive ? 'true' : 'false'}
          options={statusOptions}
          onChange={(value) => setIsActive(value !== 'false')}
        />
      </View>

      <View style={styles.section}>
        <Text variant="caption" color="textSecondary" style={styles.sectionLabel}>
          Active days (leave empty for all days)
        </Text>
        <View style={styles.chipRow}>
          {DAYS.map((day) => {
            const active = daysOfWeek.includes(day.id);
            return (
              <ScalePressable
                key={day.id}
                haptic={false}
                onPress={() => toggleDay(day.id)}
                style={active ? styles.chipActive : styles.chip}
              >
                <Text variant="caption" color={active ? 'onSecondary' : 'textSecondary'}>
                  {day.label}
                </Text>
              </ScalePressable>
            );
          })}
        </View>
        <Text variant="caption" color="textMuted" style={styles.hint}>
          Select specific days when this shift is available, or leave empty for all days.
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="caption" color="textSecondary" style={styles.sectionLabel}>
          Allowed access types
        </Text>
        <View style={styles.chipRow}>
          {ACCESS_TYPES.map((type) => {
            const active = accessTypes.includes(type);
            return (
              <ScalePressable
                key={type}
                haptic={false}
                onPress={() => toggleAccess(type)}
                style={active ? styles.chipActive : styles.chip}
              >
                <Text variant="caption" color={active ? 'onSecondary' : 'textSecondary'}>
                  {type}
                </Text>
              </ScalePressable>
            );
          })}
        </View>
        <Text variant="caption" color="textMuted" style={styles.hint}>
          Leave empty to allow all training access types.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button label="Cancel" variant="outline" onPress={() => navigation.goBack()} style={styles.footerBtn} />
        <Button
          label={isEdit ? 'Update shift' : 'Create shift'}
          onPress={save}
          loading={saving}
          style={styles.footerBtn}
        />
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    marginBottom: tokens.spacing.lg,
  },
  section: {
    marginBottom: tokens.spacing.lg,
  },
  sectionLabel: {
    marginBottom: tokens.spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
  chipActive: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.secondary,
  },
  hint: {
    marginTop: tokens.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  footerBtn: {
    flex: 1,
  },
});
