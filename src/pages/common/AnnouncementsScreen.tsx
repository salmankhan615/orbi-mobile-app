import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { Text } from '@/components/ui/Text';
import { useAnnouncements } from '@/queries/useAnnouncements';
import { useIsStaff } from '@/hooks/useHasPermission';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'Announcements'>;

export function AnnouncementsScreen({ navigation }: Props) {
  const isStaff = useIsStaff();
  const { data, isLoading } = useAnnouncements(isStaff ? 'staff' : 'students');

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
            onPress={() => navigation.navigate('AnnouncementDetail', { announcementId: item.id })}
          />
        ))
      )}
    </StackScreen>
  );
}
