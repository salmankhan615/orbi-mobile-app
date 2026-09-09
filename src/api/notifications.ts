import { announcementsApi } from '@/api/announcements';

export type NotificationType =
  | 'announcement'
  | 'upcoming_class'
  | 'upcoming_training'
  | 'course_progress';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

/** CRM has no notifications inbox — derive bell feed from announcements/my. */
export const notificationsApi = {
  async list(): Promise<AppNotification[]> {
    const announcements = await announcementsApi.list();
    return announcements.map((item) => ({
      id: item.id,
      type: 'announcement' as const,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      read: Boolean(item.isAcknowledged),
    }));
  },

  async unreadCount(): Promise<number> {
    const list = await notificationsApi.list();
    return list.filter((item) => !item.read).length;
  },

  async markRead(id: string): Promise<void> {
    await announcementsApi.acknowledge(id);
  },
};
