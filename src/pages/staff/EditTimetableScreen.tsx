import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { IconButton } from '@/components/ui/IconButton';
import { StackScreen } from '@/components/custom/StackScreen';
import { Spinner } from '@/components/ui/Spinner';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FilterSelectRow } from '@/features/bookings/components/BookingFilters';
import {
  getClassCalendarById,
  getCourseSettings,
  getUsersByType,
  updateClassCalendar,
} from '@/api/crm';
import { staffApi } from '@/api/staff';
import { unwrapList } from '@/api/unwrap';
import { sessionsKeys } from '@/queries/useSessions';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'EditTimetable'>;
type EditScope = 'this' | 'following' | 'all';

type UnknownRecord = Record<string, unknown>;

const SCOPE_OPTIONS: { id: EditScope; title: string; subtitle: string }[] = [
  {
    id: 'this',
    title: 'This event',
    subtitle: 'Only this occurrence will be changed.',
  },
  {
    id: 'following',
    title: 'This and following events',
    subtitle:
      'This and all future events in the series will be changed. A new series will be created from this point.',
  },
  {
    id: 'all',
    title: 'All events in the series',
    subtitle: 'Every event in this series will be changed.',
  },
];

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function idOf(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    const raw = String(value).trim();
    return raw && raw !== 'null' && raw !== 'undefined' ? raw : '';
  }
  const row = asRecord(value);
  if (!row) return '';
  if (row._id != null) return idOf(row._id);
  if (row.$oid != null) return String(row.$oid);
  if (row.id != null) return idOf(row.id);
  return '';
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function personName(raw: unknown): string {
  const row = asRecord(raw);
  if (!row) return str(raw);
  return `${str(row.name)} ${str(row.lname)}`.trim() || str(row.email);
}

function toDay(value: unknown): string {
  const raw = str(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

/** CRM `<input type="time">` uses 24h `HH:mm` (UTC components from ISO). */
function toTimeInput(value: unknown): string {
  const raw = str(value);
  if (!raw) return '';
  const iso = raw.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const meridiem = raw.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (meridiem) {
    let hour = Number(meridiem[1]);
    const minute = meridiem[2];
    const suffix = meridiem[3].toLowerCase();
    if (suffix === 'pm' && hour < 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return '';
}

function normalizeHHmm(value: string): string {
  return toTimeInput(value.trim());
}

/** Matches ORBI `rt(date, time)` — UTC ISO for `updateClassCalendar`. */
function combineDateAndTime(date: string, time: string): string | null {
  const day = date.trim();
  const clock = normalizeHHmm(time);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(clock)) return null;
  const [year, month, dayNum] = day.split('-').map(Number);
  const [hour, minute] = clock.split(':').map(Number);
  const iso = new Date(Date.UTC(year, month - 1, dayNum, hour, minute)).toISOString();
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function normalizeStatus(raw: unknown): string {
  const status = str(raw, 'active').toLowerCase().replace(/_/g, '-');
  if (status === 'inactive' || status === 'in-active') return 'in-active';
  if (status === 'active') return 'active';
  return status || 'active';
}

const STATUS_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'in-active', label: 'In-Active' },
];

export function EditTimetableScreen({ route, navigation }: Props) {
  const classId = route.params.classId;
  const canEdit = useHasPermission('edit_calendar');
  const companyId = useAuthStore((state) => state.user?.companyId);
  const showToast = useToastStore((state) => state.show);
  const client = useQueryClient();
  const insets = useSafeAreaInsets();
  const [scopeOpen, setScopeOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['staff', 'class', classId],
    queryFn: () => getClassCalendarById(classId),
    enabled: Boolean(classId),
  });

  const optionsQuery = useQuery({
    queryKey: ['staff', 'timetableOptions'],
    queryFn: async () => {
      const [settings, staffRaw, groups] = await Promise.all([
        getCourseSettings(),
        getUsersByType({ userType: 'staff' }).catch(() => []),
        staffApi.groups().catch(() => []),
      ]);
      return {
        classes: (settings.classes ?? []).map((item) => ({
          id: String(item._id),
          label: item.title,
        })),
        locations: (settings.locations ?? []).map((item) => ({
          id: String(item._id),
          label: item.title,
        })),
        instructors: unwrapList(staffRaw)
          .map((item) => {
            const row = asRecord(item);
            return {
              id: idOf(row?._id ?? row?.id),
              label: personName(row) || 'Staff',
            };
          })
          .filter((item) => item.id),
        groups: groups.map((group) => ({ id: group.id, label: group.name })),
      };
    },
    enabled: canEdit,
  });

  const detailRow = useMemo(() => {
    const root = asRecord(detailQuery.data);
    return asRecord(root?.data) ?? root;
  }, [detailQuery.data]);

  const detailGroup = useMemo(() => {
    if (!detailRow) return null;
    const groupRaw = detailRow.groupId ?? detailRow.group;
    const id = idOf(groupRaw);
    if (!id) return null;
    const populated = asRecord(groupRaw);
    return {
      id,
      label: str(populated?.groupName, populated?.name, detailRow.groupName, 'Current group'),
    };
  }, [detailRow]);

  const seriesId = useMemo(() => {
    if (!detailRow) return '';
    return idOf(detailRow.seriesId) || str(detailRow.seriesId);
  }, [detailRow]);
  const isRecurring = Boolean(seriesId) || detailRow?.isRecurring === true;

  const [classType, setClassType] = useState('');
  const [groupId, setGroupId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [bookingLimit, setBookingLimit] = useState('10');
  const [link, setLink] = useState('');
  const [classDate, setClassDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('active');
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!detailRow || seeded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds edit form once class detail loads
    setClassType(idOf(detailRow.classType) || str(detailRow.classType));
    setGroupId(idOf(detailRow.groupId ?? detailRow.group));
    setInstructorId(idOf(detailRow.instructor) || str(detailRow.instructor));
    setLocationId(idOf(detailRow.location) || str(detailRow.location));
    setBookingLimit(String(detailRow.bookingLimit ?? '10'));
    setLink(str(detailRow.link, detailRow.classLink, detailRow.joinUrl));
    setClassDate(toDay(detailRow.classDate ?? detailRow.date ?? detailRow.startTime));
    setStartTime(toTimeInput(detailRow.startTime ?? detailRow.start));
    setEndTime(toTimeInput(detailRow.endTime ?? detailRow.end));
    setStatus(normalizeStatus(detailRow.status));
    setSeeded(true);
  }, [detailRow, seeded]);

  const classOptions = useMemo(
    () => [{ id: '', label: 'Select class…' }, ...(optionsQuery.data?.classes ?? [])],
    [optionsQuery.data?.classes],
  );
  const locationOptions = useMemo(
    () => [{ id: '', label: 'Select location…' }, ...(optionsQuery.data?.locations ?? [])],
    [optionsQuery.data?.locations],
  );
  const instructorOptions = useMemo(
    () => [{ id: '', label: 'Select instructor…' }, ...(optionsQuery.data?.instructors ?? [])],
    [optionsQuery.data?.instructors],
  );
  const groupOptions = useMemo(() => {
    const base = optionsQuery.data?.groups ?? [];
    const merged =
      detailGroup && !base.some((group) => group.id === detailGroup.id)
        ? [detailGroup, ...base]
        : base;
    return [{ id: '', label: 'Select group…' }, ...merged];
  }, [optionsQuery.data?.groups, detailGroup]);

  const save = useMutation({
    mutationFn: (scope: EditScope) => {
      const startIso = combineDateAndTime(classDate, startTime);
      const endIso = combineDateAndTime(classDate, endTime);
      if (!startIso || !endIso) {
        throw new Error('Invalid class time selected.');
      }
      if (Date.parse(endIso) <= Date.parse(startIso)) {
        throw new Error('End time must be after start time.');
      }
      return updateClassCalendar(classId, {
        classType: classType || undefined,
        location: locationId || null,
        instructor: instructorId || null,
        groupId: groupId || null,
        classDate: classDate || undefined,
        date: classDate || undefined,
        bookingLimit: bookingLimit === '' ? '' : Number(bookingLimit),
        link,
        startTime: startIso,
        endTime: endIso,
        status,
        companyId,
        scope,
      });
    },
    onSuccess: () => {
      setScopeOpen(false);
      haptics.success();
      showToast('Timetable updated', 'success');
      client.invalidateQueries({ queryKey: sessionsKeys.all });
      client.invalidateQueries({ queryKey: ['staff', 'class', classId] });
      navigation.goBack();
    },
    onError: (error) => {
      haptics.warning();
      showToast(error instanceof Error ? error.message : 'Failed to update timetable', 'danger');
    },
  });

  function validateForm(): boolean {
    if (!classType) {
      showToast('Select a class', 'neutral');
      return false;
    }
    if (!locationId) {
      showToast('Select a location', 'neutral');
      return false;
    }
    if (!classDate || !startTime || !endTime) {
      showToast('Date and times are required', 'neutral');
      return false;
    }
    if (
      bookingLimit === '' ||
      !Number.isInteger(Number(bookingLimit)) ||
      Number(bookingLimit) <= 0
    ) {
      showToast('Booking limit must be a positive whole number', 'neutral');
      return false;
    }
    return true;
  }

  function requestSave() {
    if (!validateForm()) return;
    if (isRecurring) {
      setScopeOpen(true);
      return;
    }
    save.mutate('this');
  }

  if (!canEdit) {
    return (
      <StackScreen title="Edit timetable">
        <Text variant="body" color="textMuted">
          You do not have permission to edit this class.
        </Text>
      </StackScreen>
    );
  }

  if (detailQuery.isLoading && !detailQuery.data) {
    return (
      <StackScreen title="Edit timetable">
        <Spinner fill label="Loading class…" />
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Edit timetable" keyboardAvoiding>
      <View style={styles.field}>
        <FilterSelectRow
          label="Class *"
          value={classType}
          options={classOptions}
          onChange={setClassType}
        />
      </View>
      <View style={styles.field}>
        <FilterSelectRow
          label="Group"
          value={groupId}
          options={groupOptions}
          onChange={setGroupId}
        />
      </View>
      <View style={styles.field}>
        <FilterSelectRow
          label="Instructor"
          value={instructorId}
          options={instructorOptions}
          onChange={setInstructorId}
        />
      </View>
      <TextField
        label="Booking limit *"
        value={bookingLimit}
        onChangeText={setBookingLimit}
        keyboardType="number-pad"
        placeholder="10"
      />
      <TextField
        label="Class link (URL)"
        value={link}
        onChangeText={setLink}
        autoCapitalize="none"
        placeholder="https://"
      />
      <View style={styles.field}>
        <FilterSelectRow
          label="Location *"
          value={locationId}
          options={locationOptions}
          onChange={setLocationId}
        />
      </View>
      <TextField
        label="Class date *"
        value={classDate}
        onChangeText={setClassDate}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        autoCorrect={false}
      />
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
        placeholder="13:00"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.field}>
        <FilterSelectRow
          label="Status *"
          value={status}
          options={STATUS_OPTIONS}
          onChange={setStatus}
        />
      </View>

      <View style={styles.actions}>
        <Button
          label="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.actionBtn}
        />
        <Button
          label="Update"
          loading={save.isPending && !scopeOpen}
          style={styles.actionBtn}
          onPress={requestSave}
        />
      </View>

      <Modal
        visible={scopeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !save.isPending && setScopeOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => !save.isPending && setScopeOpen(false)}
          />
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}
          >
            <View style={styles.sheetHeader}>
              <Text variant="title" style={styles.sheetTitle}>
                Edit recurring event
              </Text>
              <IconButton name="close" onPress={() => !save.isPending && setScopeOpen(false)} />
            </View>
            <Text variant="bodySmall" color="textSecondary" style={styles.sheetCopy}>
              This event is part of a series. Which events do you want to edit?
            </Text>
            <View style={styles.scopeList}>
              {SCOPE_OPTIONS.map((option) => (
                <ScalePressable
                  key={option.id}
                  disabled={save.isPending}
                  onPress={() => save.mutate(option.id)}
                  style={styles.scopeOption}
                >
                  <Text variant="bodySmall" style={styles.scopeTitle}>
                    {option.title}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {option.subtitle}
                  </Text>
                </ScalePressable>
              ))}
            </View>
            {save.isPending ? (
              <Text variant="caption" color="textMuted" style={styles.savingHint}>
                Saving…
              </Text>
            ) : null}
            <Button
              label="Cancel"
              variant="outline"
              disabled={save.isPending}
              onPress={() => setScopeOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: tokens.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  actionBtn: {
    flex: 1,
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
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.lg,
    ...tokens.shadows.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  sheetTitle: {
    flex: 1,
  },
  sheetCopy: {
    marginBottom: tokens.spacing.lg,
  },
  scopeList: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  scopeOption: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.md,
    gap: tokens.spacing.xxs,
    ...tokens.shadows.sm,
  },
  scopeTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  savingHint: {
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
});
