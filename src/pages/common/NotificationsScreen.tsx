import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { StackScreen } from '@/components/custom/StackScreen';
import { EmptyState } from '@/components/custom/EmptyState';
import { EntityListSkeleton } from '@/components/custom/Skeletons';
import { HeroBanner } from '@/components/custom/HeroBanner';
import { Text } from '@/components/ui/Text';
import { AnnouncementModal } from '@/features/announcements/components/AnnouncementModal';
import { NotificationCard } from '@/features/notifications/components/NotificationCard';
import { useNotifications } from '@/queries/useNotifications';
import { useAnnouncements, useAcknowledgeAnnouncement } from '@/queries/useAnnouncements';
import { useIsStaff } from '@/hooks/useHasPermission';

export function NotificationsScreen() {
  const isStaff = useIsStaff();
  const { data, isLoading } = useNotifications();
  const { data: announcements } = useAnnouncements(isStaff ? 'staff' : 'students');
  const acknowledgeAnnouncement = useAcknowledgeAnnouncement();
  const [openId, setOpenId] = useState<string | null>(null);

  const items = data ?? [];
  const unreadCount = items.filter((item) => !item.read).length;
  const openAnnouncement = (announcements ?? []).find((item) => item.id === openId);

  const { unread, earlier } = useMemo(() => {
    const nextUnread = items.filter((item) => !item.read);
    const nextEarlier = items.filter((item) => item.read);
    return { unread: nextUnread, earlier: nextEarlier };
  }, [items]);

  return (
    <StackScreen
      title="Notifications"
      footer={
        openAnnouncement ? (
          <AnnouncementModal
            visible
            announcement={openAnnouncement}
            onAcknowledge={() => {
              acknowledgeAnnouncement.mutate(openAnnouncement.id);
              setOpenId(null);
            }}
          />
        ) : null
      }
    >
      <HeroBanner
        kicker="Inbox"
        title={unreadCount > 0 ? `${unreadCount} new update${unreadCount === 1 ? '' : 's'}` : "You're all caught up"}
        subtitle={
          unreadCount > 0
            ? 'Tap a card to read the announcement.'
            : "We'll drop class, training, and course updates here."
        }
        icon="notifications-outline"
      />

      {isLoading ? (
        <EntityListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Nothing yet"
          message="You're all caught up. New announcements will appear here."
        />
      ) : (
        <>
          {unread.length > 0 ? (
            <View style={styles.section}>
              <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
                New
              </Text>
              {unread.map((item) => (
                <NotificationCard key={item.id} item={item} onPress={() => setOpenId(item.id)} />
              ))}
            </View>
          ) : null}
          {earlier.length > 0 ? (
            <View style={styles.section}>
              <Text variant="overline" color="textMuted" style={styles.sectionLabel}>
                Earlier
              </Text>
              {earlier.map((item) => (
                <NotificationCard key={item.id} item={item} onPress={() => setOpenId(item.id)} />
              ))}
            </View>
          ) : null}
        </>
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: tokens.spacing.md,
  },
  sectionLabel: {
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
});
