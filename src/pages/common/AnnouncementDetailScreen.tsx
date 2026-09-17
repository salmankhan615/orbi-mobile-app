import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { useAnnouncement } from '@/queries/useAnnouncements';
import { useHasPermission } from '@/hooks/useHasPermission';
import type { RootStackScreenProps } from '@/navigation/types';
import type { BadgeTone } from '@/components/ui/Badge';

type Props = RootStackScreenProps<'AnnouncementDetail'>;

function statusTone(status?: string): BadgeTone {
  const value = (status ?? '').toLowerCase();
  if (value.includes('publish')) return 'success';
  if (value.includes('archiv')) return 'warning';
  return 'primary';
}

export function AnnouncementDetailScreen({ route, navigation }: Props) {
  const { data, isLoading } = useAnnouncement(route.params.announcementId);
  const canEdit = useHasPermission('manage_announcements');

  if (isLoading || !data) {
    return (
      <StackScreen title="Announcement">
        <EntityListSkeleton rows={3} />
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Announcement">
      <View style={styles.badges}>
        <Badge label={data.type ?? 'General'} tone="primary" />
        {data.status ? <Badge label={data.status} tone={statusTone(data.status)} /> : null}
        {data.pinned ? <Badge label="Pinned" tone="warning" /> : null}
      </View>
      <Text variant="heading" style={styles.title}>
        {data.title}
      </Text>
      <Text variant="caption" color="textMuted" style={styles.meta}>
        {data.author}
        {data.publishLabel ? ` · ${data.publishLabel}` : ''}
      </Text>
      {data.expiryLabel ? (
        <Text variant="caption" color="textMuted" style={styles.expiry}>
          Expiry: {data.expiryLabel}
        </Text>
      ) : null}
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  title: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  meta: {
    marginBottom: tokens.spacing.xs,
  },
  expiry: {
    marginBottom: tokens.spacing.lg,
  },
  edit: {
    marginTop: tokens.spacing.xl,
  },
});
