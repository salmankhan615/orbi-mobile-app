export type NotificationType =
  'announcement' | 'upcoming_class' | 'upcoming_training' | 'course_progress';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

const notifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'announcement',
    title: 'August timetable is live',
    body: 'New class times start Monday 4 August.',
    createdAt: '2026-08-01T09:05:00Z',
    read: false,
  },
  {
    id: 'n2',
    type: 'upcoming_class',
    title: 'Sage 50 Session 1 tomorrow',
    body: 'Online class at 10:00 with Arslan M.',
    createdAt: '2026-08-03T16:00:00Z',
    read: false,
  },
  {
    id: 'n3',
    type: 'upcoming_training',
    title: 'Customer Care workshop',
    body: 'In-person training on 6 August at 14:00.',
    createdAt: '2026-08-02T12:00:00Z',
    read: true,
  },
  {
    id: 'n4',
    type: 'course_progress',
    title: 'Keep going on ACCA Skills',
    body: 'You are 45% through. Complete Journal Entries next.',
    createdAt: '2026-08-03T08:00:00Z',
    read: true,
  },
];

function mockDelay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const notificationsApi = {
  list: (): Promise<AppNotification[]> => mockDelay(notifications),
  unreadCount: (): Promise<number> => mockDelay(notifications.filter((item) => !item.read).length),
  markRead: (id: string): Promise<void> => {
    const item = notifications.find((n) => n.id === id);
    if (item) item.read = true;
    return mockDelay(undefined);
  },
};
