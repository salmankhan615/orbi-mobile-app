import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { PermissionGate } from '@/components/custom/PermissionGate';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { Spinner } from '@/components/ui/Spinner';
import {
  useStaffGroups,
  useGroupStudents,
  useGroupSessions,
} from '@/queries/useStaff';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'GroupDetail'>;
type TabKey = 'students' | 'sessions';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'students', label: 'Students' },
  { key: 'sessions', label: 'Sessions' },
];

export function GroupDetailScreen({ route, navigation }: Props) {
  const groupId = route.params.groupId;
  const canSessions = useHasPermission('view_group_sessions');
  const { data: groups, isLoading: groupsLoading } = useStaffGroups();
  const group = groups?.find((item) => item.id === groupId);
  const { data: students, isLoading: studentsLoading } = useGroupStudents(groupId);
  const { data: sessions, isLoading: sessionsLoading } = useGroupSessions(groupId);
  const [tab, setTab] = useState<TabKey>('students');

  const roster = students ?? [];
  const sessionList = sessions ?? [];
  const studentCount = roster.length > 0 ? roster.length : (group?.studentCount ?? 0);

  const tabs = useMemo(
    () => (canSessions ? TABS : TABS.filter((item) => item.key === 'students')),
    [canSessions],
  );

  return (
    <StackScreen title={group?.name ?? 'Group'} scroll={false}>
      <PermissionGate permission="view_groups" message="You cannot view this group.">
        <Text variant="bodySmall" color="textSecondary" style={styles.course}>
          {group?.courseTitle}
        </Text>
        <Text variant="caption" color="textMuted" style={styles.meta}>
          {studentCount} student{studentCount === 1 ? '' : 's'}
          {group?.nextSession && group.nextSession !== '—'
            ? ` · next ${group.nextSession}`
            : ''}
        </Text>

        {groupsLoading && !group ? <Spinner fill label="Loading group…" /> : null}

        <View style={styles.tabs}>
          {tabs.map((item) => {
            const active = tab === item.key;
            const count = item.key === 'students' ? roster.length : sessionList.length;
            const loading = item.key === 'students' ? studentsLoading : sessionsLoading;
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
                  >
                    {item.label}
                    {loading ? '' : ` · ${count}`}
                  </Text>
                </View>
              </ScalePressable>
            );
          })}
        </View>

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
        ) : !canSessions ? (
          <Text variant="bodySmall" color="textMuted">
            Session details are hidden for your role.
          </Text>
        ) : sessionsLoading ? (
          <EntityListSkeleton rows={4} />
        ) : sessionList.length === 0 ? (
          <EmptyState icon="calendar-outline" message="No sessions scheduled for this group." />
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
        )}
      </PermissionGate>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  course: {
    marginBottom: tokens.spacing.xs,
  },
  meta: {
    marginBottom: tokens.spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  tabPress: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: tokens.colors.secondary,
  },
  tabLabel: {
    fontFamily: tokens.fontFamily.medium,
  },
  list: {
    paddingBottom: tokens.spacing.xl,
  },
});
