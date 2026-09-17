import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { FilterSelectRow } from '@/features/bookings/components/BookingFilters';
import {
  formatShiftAccess,
  formatShiftDays,
  type PracticalShiftDefinition,
} from '@/api/staff';
import { useTrainingLocations } from '@/queries/useBookings';
import {
  useDeletePracticalShift,
  usePracticalShifts,
} from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'PracticalShifts'>;

export function PracticalShiftsScreen({ navigation }: Props) {
  const allowed = useHasPermission('view_shifts');
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState('');
  const { data: locations = [] } = useTrainingLocations();
  const filters = useMemo(
    () => ({
      location: locationId || undefined,
      isActive: status || undefined,
    }),
    [locationId, status],
  );
  const { data, isLoading, refetch, isRefetching } = usePracticalShifts(filters);
  const remove = useDeletePracticalShift();
  const showToast = useToastStore((state) => state.show);
  const shifts = data ?? [];

  const locationOptions = useMemo(
    () => [{ id: '', label: 'All locations' }, ...locations.map((item) => ({ id: item.id, label: item.title }))],
    [locations],
  );

  const statusOptions = [
    { id: '', label: 'All' },
    { id: 'true', label: 'Active' },
    { id: 'false', label: 'Inactive' },
  ];

  function confirmDelete(shift: PracticalShiftDefinition) {
    Alert.alert('Delete shift', `Delete “${shift.name}” at ${shift.locationName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove.mutate(shift.id, {
            onSuccess: () => {
              haptics.success();
              showToast('Shift deleted', 'success');
            },
            onError: () => {
              haptics.warning();
              showToast('Could not delete shift', 'danger');
            },
          });
        },
      },
    ]);
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

  return (
    <StackScreen
      title="Practical shifts"
      scroll={false}
      right={
        <ScalePressable
          onPress={() => navigation.navigate('ShiftEditor', {})}
          style={styles.headerAction}
        >
          <Ionicons name="add" size={22} color={tokens.colors.primary} />
        </ScalePressable>
      }
    >
      <Text variant="bodySmall" color="textSecondary" style={styles.copy}>
        Manage shift schedules and booking limits.
      </Text>

      <View style={styles.filters}>
        <FilterSelectRow
          label="Location"
          value={locationId}
          options={locationOptions}
          onChange={setLocationId}
        />
        <FilterSelectRow
          label="Status"
          value={status}
          options={statusOptions}
          onChange={setStatus}
        />
      </View>

      <Button
        label={isRefetching ? 'Refreshing…' : 'Refresh'}
        icon="refresh-outline"
        variant="outline"
        onPress={() => refetch()}
        style={styles.refresh}
      />

      {isLoading ? (
        <EntityListSkeleton />
      ) : shifts.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No shifts"
          message="Tap + to create a practical training shift schedule."
        />
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.swatch, { backgroundColor: item.color || tokens.colors.primary }]} />
                <View style={styles.cardBody}>
                  <Text variant="bodySmall" style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {item.locationName}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {item.startTime} – {item.endTime} · {item.defaultBookingLimit} seats
                  </Text>
                  <Text variant="caption" color="textSecondary" numberOfLines={1}>
                    {formatShiftDays(item.daysOfWeek)} · {formatShiftAccess(item.allowedAccessTypes)}
                  </Text>
                </View>
                <Badge
                  label={item.isActive ? 'Active' : 'Inactive'}
                  tone={item.isActive ? 'success' : 'neutral'}
                />
              </View>
              <View style={styles.actions}>
                <ScalePressable
                  onPress={() => navigation.navigate('ShiftEditor', { shiftId: item.id })}
                  style={styles.actionBtn}
                >
                  <Ionicons name="create-outline" size={18} color={tokens.colors.primary} />
                  <Text variant="caption" color="primary">
                    Edit
                  </Text>
                </ScalePressable>
                <ScalePressable onPress={() => confirmDelete(item)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={18} color={tokens.colors.danger} />
                  <Text variant="caption" color="danger">
                    Delete
                  </Text>
                </ScalePressable>
              </View>
            </View>
          )}
        />
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    marginBottom: tokens.spacing.md,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  refresh: {
    marginBottom: tokens.spacing.md,
  },
  list: {
    paddingBottom: tokens.spacing.xl,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: tokens.fontFamily.semibold,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
});
