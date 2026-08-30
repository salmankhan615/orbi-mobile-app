import { StackScreen } from '@/components/custom/StackScreen';
import { EntityRow } from '@/components/custom/EntityRow';
import { Text } from '@/components/ui/Text';
import { useNotifications, useMarkNotificationRead } from '@/queries/useNotifications';
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
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <StackScreen title="Notifications">
      {(data ?? []).length === 0 ? (
        <Text variant="body" color="textMuted">
          You are all caught up.
        </Text>
      ) : (
        (data ?? []).map((item) => (
          <EntityRow
            key={item.id}
            icon={TYPE_META[item.type].icon}
            title={item.title}
            subtitle={item.body}
            badge={{
              label: item.read ? TYPE_META[item.type].label : 'New',
              tone: item.read ? TYPE_META[item.type].tone : 'warning',
            }}
            onPress={() => markRead.mutate(item.id)}
          />
        ))
      )}
    </StackScreen>
  );
}
