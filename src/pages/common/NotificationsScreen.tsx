import { useState } from 'react';
import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import { Text } from '@/components/ui/Text';
import { AnnouncementModal } from '@/features/announcements/components/AnnouncementModal';
import { useNotifications } from '@/queries/useNotifications';
import { useAnnouncements, useAcknowledgeAnnouncement } from '@/queries/useAnnouncements';
import { useIsStaff } from '@/hooks/useHasPermission';
import type { NotificationType } from '@/api/notifications';
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

export function NotificationsScreen() {
  const isStaff = useIsStaff();
  const { data } = useNotifications();
  const { data: announcements } = useAnnouncements(isStaff ? 'staff' : 'students');
  const acknowledgeAnnouncement = useAcknowledgeAnnouncement();
  const [openId, setOpenId] = useState<string | null>(null);

  const items = data ?? [];
  const openAnnouncement = (announcements ?? []).find((item) => item.id === openId);

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
            onPress={() => setOpenId(item.id)}
          />
        ))
      )}
    </StackScreen>
  );
}
