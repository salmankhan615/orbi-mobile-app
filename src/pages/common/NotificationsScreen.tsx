import { useMemo, useState } from 'react';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import { Text } from '@/components/ui/Text';
import { AnnouncementModal } from '@/features/announcements/components/AnnouncementModal';
import { useNotifications, useMarkNotificationRead } from '@/queries/useNotifications';
import { useAnnouncements, useAcknowledgeAnnouncement } from '@/queries/useAnnouncements';
import type { Announcement } from '@/api/announcements';
import type { AppNotification, NotificationType } from '@/api/notifications';
import type { BadgeTone } from '@/components/ui/Badge';

const TYPE_META: Record<
  NotificationType,
  {
    icon: 'megaphone-outline' | 'calendar-outline' | 'fitness-outline' | 'trending-up-outline';
    tone: BadgeTone;
    label: string;
  }
> = {
  announcement: { icon: 'megaphone-outline', tone: 'warning', label: 'Announcement' },
  upcoming_class: { icon: 'calendar-outline', tone: 'primary', label: 'Class' },
  upcoming_training: { icon: 'fitness-outline', tone: 'success', label: 'Training' },
  course_progress: { icon: 'trending-up-outline', tone: 'neutral', label: 'Progress' },
};

function announcementFromNotification(item: AppNotification): Announcement {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    createdAt: item.createdAt,
    author: 'System Admin',
    audience: 'all',
    pinned: false,
    isAcknowledged: item.read,
  };
}

export function NotificationsScreen() {
  const { data } = useNotifications();
  const { data: announcements } = useAnnouncements();
  const markRead = useMarkNotificationRead();
  const acknowledge = useAcknowledgeAnnouncement();
  const [openId, setOpenId] = useState<string | null>(null);

  const items = data ?? [];
  const openItem = items.find((item) => item.id === openId);
  const openAnnouncement = useMemo(() => {
    if (!openId) return null;
    return (
      (announcements ?? []).find((item) => item.id === openId) ??
      (openItem ? announcementFromNotification(openItem) : null)
    );
  }, [announcements, openId, openItem]);

  function handlePress(item: AppNotification) {
    if (item.type === 'announcement') {
      setOpenId(item.id);
      return;
    }
    markRead.mutate(item.id);
  }

  function handleAcknowledge() {
    if (openAnnouncement && !openAnnouncement.isAcknowledged) {
      acknowledge.mutate(openAnnouncement.id);
    }
    setOpenId(null);
  }

  return (
    <StackScreen
      title="Notifications"
      footer={
        openAnnouncement ? (
          <AnnouncementModal
            visible
            announcement={openAnnouncement}
            onAcknowledge={handleAcknowledge}
            onDismiss={() => setOpenId(null)}
          />
        ) : null
      }
    >
      {items.length === 0 ? (
        <Text variant="body" color="textMuted">
          You are all caught up.
        </Text>
      ) : (
        items.map((item) => (
          <EntityRow
            key={item.id}
            icon={TYPE_META[item.type].icon}
            title={item.title}
            subtitle={item.body}
            badge={{
              label: item.read ? TYPE_META[item.type].label : 'New',
              tone: item.read ? TYPE_META[item.type].tone : 'warning',
            }}
            onPress={() => handlePress(item)}
          />
        ))
      )}
    </StackScreen>
  );
}
