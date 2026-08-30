export type AnnouncementAudience = 'all' | 'students' | 'staff';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: string;
  audience: AnnouncementAudience;
  pinned: boolean;
}

let announcements: Announcement[] = [
  {
    id: 'a1',
    title: 'August timetable is live',
    body: 'New class times for ACCA Skills and Digital Accounts start Monday 4 August. Book your seat from Calendar or Book Class.',
    createdAt: '2026-08-01T09:00:00Z',
    author: 'KBM Admin',
    audience: 'all',
    pinned: true,
  },
  {
    id: 'a2',
    title: 'Coursework deadline reminder',
    body: 'Module 1 journal entries assignment is due Friday. Submit from Coursework before 18:00.',
    createdAt: '2026-08-03T11:30:00Z',
    author: 'Arslan Malik',
    audience: 'students',
    pinned: false,
  },
  {
    id: 'a3',
    title: 'Staff briefing: attendance',
    body: 'Please mark attendance within 15 minutes of class start. Closed days must be flagged by Friday.',
    createdAt: '2026-08-02T08:00:00Z',
    author: 'KBM Admin',
    audience: 'staff',
    pinned: false,
  },
];

function mockDelay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const announcementsApi = {
  list: (audience?: AnnouncementAudience): Promise<Announcement[]> => {
    const list =
      !audience || audience === 'all'
        ? announcements
        : announcements.filter((item) => item.audience === 'all' || item.audience === audience);
    return mockDelay([...list].sort((a, b) => Number(b.pinned) - Number(a.pinned)));
  },
  getById: (id: string): Promise<Announcement | undefined> =>
    mockDelay(announcements.find((item) => item.id === id)),
  create: (payload: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    const item: Announcement = {
      ...payload,
      id: `a${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    announcements = [item, ...announcements];
    return mockDelay(item);
  },
  update: (id: string, patch: Partial<Announcement>): Promise<Announcement | undefined> => {
    announcements = announcements.map((item) => (item.id === id ? { ...item, ...patch } : item));
    return mockDelay(announcements.find((item) => item.id === id));
  },
};
