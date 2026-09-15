import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { PermissionGate } from '@/components/custom/PermissionGate';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { Spinner } from '@/components/ui/Spinner';
import { FilterSelectRow } from '@/features/bookings/components/BookingFilters';
import { statusBadgeTone } from '@/features/staff/groupFilters';
import {
  useAssignGroupStaff,
  useGroupDetail,
  useGroupSessions,
  useGroupStaffOptions,
  useGroupStudents,
  useRemoveGroupStaff,
  useStaffGroups,
} from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToastStore } from '@/store/useToastStore';
import { formatPortalDate } from '@/utils/date';
import { haptics } from '@/utils/haptics';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'GroupDetail'>;
type TabKey = 'overview' | 'students' | 'staff' | 'sessions';

export function GroupDetailScreen({ route, navigation }: Props) {
  const groupId = route.params.groupId;
  const canSessions = useHasPermission('view_group_sessions');
  const { data: groups, isLoading: groupsLoading } = useStaffGroups();
  const { data: detail, isLoading: detailLoading } = useGroupDetail(groupId);
  const listGroup = groups?.find((item) => item.id === groupId);
  const group = detail ?? listGroup;
  const { data: students, isLoading: studentsLoading } = useGroupStudents(groupId);
  const { data: sessions, isLoading: sessionsLoading } = useGroupSessions(groupId);
  const canManageStaff = detail?.canManageStaff === true;
  const { data: staffOptions } = useGroupStaffOptions(canManageStaff);
  const assignStaff = useAssignGroupStaff(groupId);
  const removeStaff = useRemoveGroupStaff(groupId);
  const showToast = useToastStore((state) => state.show);
  const [tab, setTab] = useState<TabKey>('overview');
  const [assignUserId, setAssignUserId] = useState('');

  const roster = students ?? [];
  const sessionList = sessions ?? [];
  const staff = useMemo(
    () => detail?.staff ?? listGroup?.staff ?? [],
    [detail?.staff, listGroup?.staff],
  );
  const studentCount = roster.length > 0 ? roster.length : (group?.studentCount ?? 0);

  const tabs = useMemo(() => {
    const all: { key: TabKey; label: string }[] = [
      { key: 'overview', label: 'Overview' },
      { key: 'students', label: 'Students' },
      { key: 'staff', label: `Staff · ${staff.length}` },
      { key: 'sessions', label: 'Sessions' },
    ];
    return canSessions ? all : all.filter((item) => item.key !== 'sessions');
  }, [canSessions, staff.length]);

  const assignOptions = useMemo(() => {
    const assigned = new Set(staff.map((member) => member.id));
    return [
      { id: '', label: 'Select a staff member…' },
      ...(staffOptions ?? [])
        .filter((option) => !assigned.has(option.id))
        .map((option) => ({ id: option.id, label: option.name })),
    ];
  }, [staff, staffOptions]);

  function handleAssign() {
    if (!assignUserId) {
      showToast('Select a staff member to assign', 'neutral');
      return;
    }
    assignStaff.mutate(assignUserId, {
      onSuccess: () => {
        haptics.success();
        showToast('Staff linked to group', 'success');
        setAssignUserId('');
      },
      onError: (error) => {
        showToast(error instanceof Error ? error.message : 'Failed to link staff', 'danger');
      },
    });
  }

  function confirmRemove(userId: string, name: string) {
    Alert.alert('Remove staff', `Remove ${name} from this group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeStaff.mutate(userId, {
            onSuccess: () => {
              haptics.warning();
              showToast('Staff removed', 'success');
            },
            onError: (error) => {
              showToast(
                error instanceof Error ? error.message : 'Failed to remove staff',
                'danger',
              );
            },
          });
        },
      },
    ]);
  }

  const schedule =
    group?.startDate || group?.endDate
      ? `${formatPortalDate(group?.startDate)} → ${formatPortalDate(group?.endDate)}`
      : '—';

  return (
    <StackScreen title={group?.name ?? 'Group'} scroll={false}>
      <PermissionGate permission="view_groups" message="You cannot view this group.">
        {(groupsLoading || detailLoading) && !group ? (
          <Spinner fill label="Loading group…" />
        ) : (
          <>
            <View style={styles.tabs}>
              {tabs.map((item) => {
                const active = tab === item.key;
                return (
                  <ScalePressable
                    key={item.key}
                    onPress={() => setTab(item.key)}
                    hapticStyle="select"
                    style={styles.tabPress}
                  >
                    <View style={[styles.tab, active && styles.tabActive]}>
                      <Text
                        variant="caption"
                        color={active ? 'secondary' : 'textSecondary'}
                        style={styles.tabLabel}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </ScalePressable>
                );
              })}
            </View>

            {tab === 'overview' ? (
              <View style={styles.overview}>
                <View style={styles.overviewCard}>
                  <OverviewRow label="Course" value={group?.courseTitle || '—'} />
                  <View style={styles.statusRow}>
                    <Text variant="caption" color="textMuted">
                      Status
                    </Text>
                    <Badge
                      label={group?.status ?? '—'}
                      tone={statusBadgeTone(group?.status ?? '')}
                    />
                  </View>
                  <OverviewRow
                    label="Days"
                    value={group?.days?.length ? group.days.join(', ') : '—'}
                  />
                  <OverviewRow label="Schedule" value={schedule} />
                  <OverviewRow
                    label="Description"
                    value={group?.description || group?.name || '—'}
                  />
                </View>

                <Text variant="bodySmall" style={styles.sectionTitle}>
                  Assigned staff ({staff.length})
                </Text>
                {staff.length === 0 ? (
                  <Text variant="caption" color="textMuted">
                    No staff assigned yet.
                  </Text>
                ) : (
                  <View style={styles.staffChips}>
                    {staff.map((member) => (
                      <View key={member.id} style={styles.staffChip}>
                        <Text variant="caption" color="secondary" style={styles.staffChipLabel}>
                          {member.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text variant="caption" color="textMuted" style={styles.meta}>
                  {studentCount} student{studentCount === 1 ? '' : 's'}
                </Text>
              </View>
            ) : null}

            {tab === 'students' ? (
              studentsLoading ? (
                <EntityListSkeleton rows={4} />
              ) : roster.length === 0 ? (
                <EmptyState icon="person-outline" message="No students in this group yet." />
              ) : (
                <FlatList
                  data={roster}
                  keyExtractor={(item) => item.id}
                  initialNumToRender={12}
                  contentContainerStyle={styles.list}
                  renderItem={({ item: student }) => (
                    <EntityRow
                      icon="person-outline"
                      title={student.name}
                      subtitle={student.email}
                      onPress={() =>
                        navigation.navigate('UserDetail', {
                          userId: student.id,
                          name: student.name,
                          email: student.email,
                          role: 'student',
                        })
                      }
                    />
                  )}
                />
              )
            ) : null}

            {tab === 'staff' ? (
              <View style={styles.staffTab}>
                {canManageStaff ? (
                  <View style={styles.assignBlock}>
                    <FilterSelectRow
                      label="Assign staff"
                      value={assignUserId}
                      options={assignOptions}
                      onChange={setAssignUserId}
                    />
                    <Button
                      label="Assign"
                      variant="secondary"
                      loading={assignStaff.isPending}
                      onPress={handleAssign}
                    />
                  </View>
                ) : null}
                {detailLoading && staff.length === 0 ? (
                  <EntityListSkeleton rows={3} />
                ) : staff.length === 0 ? (
                  <EmptyState icon="people-outline" message="No staff assigned yet." />
                ) : (
                  <FlatList
                    data={staff}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item: member }) => (
                      <EntityRow
                        icon="person-outline"
                        title={member.name}
                        subtitle={
                          member.assignedAt
                            ? `Assigned ${formatPortalDate(member.assignedAt)}`
                            : member.email
                        }
                        onPress={
                          canManageStaff ? () => confirmRemove(member.id, member.name) : undefined
                        }
                        meta={canManageStaff ? 'Tap to remove' : undefined}
                      />
                    )}
                  />
                )}
              </View>
            ) : null}

            {tab === 'sessions' ? (
              !canSessions ? (
                <Text variant="bodySmall" color="textMuted">
                  Session details are hidden for your role.
                </Text>
              ) : sessionsLoading ? (
                <EntityListSkeleton rows={4} />
              ) : sessionList.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  message="No sessions scheduled for this group."
                />
              ) : (
                <FlatList
                  data={sessionList}
                  keyExtractor={(item) => item.id}
                  initialNumToRender={12}
                  contentContainerStyle={styles.list}
                  renderItem={({ item: session }) => (
                    <EntityRow
                      icon="calendar-outline"
                      title={session.title}
                      subtitle={`${session.date} · ${session.startTime}–${session.endTime}`}
                      meta={session.location}
                      onPress={() =>
                        navigation.navigate('GroupSessionDetail', {
                          groupId,
                          classId: session.id,
                          title: session.title,
                          date: session.date,
                          startTime: session.startTime,
                          endTime: session.endTime,
                          location: session.location,
                        })
                      }
                    />
                  )}
                />
              )
            ) : null}
          </>
        )}
      </PermissionGate>
    </StackScreen>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.overviewRow}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="bodySmall">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.lg,
  },
  tabPress: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.transparent,
  },
  tabActive: {
    borderBottomColor: tokens.colors.secondary,
  },
  tabLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
  overview: {
    gap: tokens.spacing.md,
  },
  overviewCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    ...tokens.shadows.sm,
  },
  overviewRow: {
    gap: tokens.spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  sectionTitle: {
    fontFamily: tokens.fontFamily.medium,
  },
  staffChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  staffChip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.secondaryMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
  },
  staffChipLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
  meta: {
    marginTop: tokens.spacing.xs,
  },
  list: {
    paddingBottom: tokens.spacing.xl,
  },
  staffTab: {
    flex: 1,
    gap: tokens.spacing.md,
  },
  assignBlock: {
    gap: tokens.spacing.sm,
  },
});
