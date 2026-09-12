import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { PermissionGate } from '@/components/custom/PermissionGate';
import { useAnnouncements } from '@/queries/useAnnouncements';
import { useHasPermission, useIsStaff } from '@/hooks/useHasPermission';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'Announcements'>;

export function AnnouncementsScreen({ navigation }: Props) {
  const isStaff = useIsStaff();
  const canManage = useHasPermission('manage_announcements');
  // Staff manage the announcement feed; students only read the student audience.
  const { data, isLoading } = useAnnouncements(isStaff ? undefined : 'students');

  if (!isStaff) {
    return (
      <StackScreen title="Announcements">
        {isLoading ? (
          <EntityListSkeleton />
        ) : (data ?? []).length === 0 ? (
          <Text variant="body" color="textMuted">
            No announcements yet.
          </Text>
        ) : (
          (data ?? []).map((item) => (
            <EntityRow
              key={item.id}
              icon="megaphone-outline"
              title={item.title}
              subtitle={item.body}
              meta={item.author}
              badge={item.pinned ? { label: 'Pinned', tone: 'warning' } : undefined}
              onPress={() =>
                navigation.navigate('AnnouncementDetail', { announcementId: item.id })
              }
            />
          ))
        )}
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Announcements">
      <PermissionGate
        permission="view_announcements"
        message="You cannot manage announcements with this role."
      >
        <Text variant="bodySmall" color="textSecondary" style={styles.intro}>
          Create and edit posts for students, staff, or everyone. These are not shown on the staff
          overview — open this tool to manage them.
        </Text>
        {canManage ? (
          <Button
            label="Create announcement"
            icon="create-outline"
            onPress={() => navigation.navigate('AnnouncementEditor', {})}
            style={styles.create}
          />
        ) : null}
        {isLoading ? (
          <EntityListSkeleton />
        ) : (data ?? []).length === 0 ? (
          <EmptyState
            icon="megaphone-outline"
            title="No announcements"
            message={
              canManage
                ? 'Create the first announcement for learners or staff.'
                : 'Nothing published yet.'
            }
          />
        ) : (
          (data ?? []).map((item) => (
            <EntityRow
              key={item.id}
              icon="megaphone-outline"
              title={item.title}
              subtitle={item.body}
              meta={`${item.author} · ${item.audience === 'students' ? 'Students' : item.audience === 'staff' ? 'Staff' : 'Everyone'}`}
              badge={
                item.pinned
                  ? { label: 'Pinned', tone: 'warning' }
                  : item.status
                    ? { label: item.status, tone: 'primary' }
                    : undefined
              }
              onPress={() =>
                navigation.navigate('AnnouncementDetail', { announcementId: item.id })
              }
            />
          ))
        )}
        {canManage && (data ?? []).length > 0 ? (
          <View style={styles.hint}>
            <Text variant="caption" color="textMuted">
              Open a post to edit it.
            </Text>
          </View>
        ) : null}
      </PermissionGate>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: tokens.spacing.lg,
  },
  create: {
    marginBottom: tokens.spacing.lg,
  },
  hint: {
    marginTop: tokens.spacing.md,
  },
});
