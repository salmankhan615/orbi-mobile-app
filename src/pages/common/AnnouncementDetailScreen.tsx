import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { useAnnouncement } from '@/queries/useAnnouncements';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'AnnouncementDetail'>;

export function AnnouncementDetailScreen({ route, navigation }: Props) {
  const { data } = useAnnouncement(route.params.announcementId);
  const canEdit = useHasPermission('manage_announcements');

  if (!data) {
    return (
      <StackScreen title="Announcement">
        <Text variant="body" color="textMuted">
          Loading…
        </Text>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Announcement">
      {data.pinned ? <Badge label="Pinned" tone="warning" /> : null}
      <Text variant="heading" style={styles.title}>
        {data.title}
      </Text>
      <Text variant="caption" color="textMuted" style={styles.meta}>
        {data.author} · {new Date(data.createdAt).toLocaleDateString()}
      </Text>
      <Text variant="body" color="textSecondary">
        {data.body}
      </Text>
      {canEdit ? (
        <Button
          label="Edit"
          variant="secondary"
          icon="create-outline"
          onPress={() => navigation.navigate('AnnouncementEditor', { announcementId: data.id })}
          style={styles.edit}
        />
      ) : null}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  meta: {
    marginBottom: tokens.spacing.lg,
  },
  edit: {
    marginTop: tokens.spacing.xl,
  },
});
