export type SessionType = 'green' | 'red' | 'amber' | 'blue';
export type SessionStatus = 'upcoming' | 'completed' | 'cancelled';

export interface SessionAttachment {
  id: string;
  name: string;
  sizeLabel: string;
}

export interface Session {
  id: string;
  title: string;
  date: string; // ISO date, e.g. '2026-08-04'
  startTime: string;
  endTime: string;
  code: string;
  type: SessionType;
  status: SessionStatus;
  instructor: string;
  mode: 'Online' | 'In-Person';
  description: string;
  attachments: SessionAttachment[];
  /** Meeting link opened by "Join Session" for online sessions. */
  joinUrl?: string;
  /** Physical address shown/opened by "Join Session" for in-person sessions. */
  location?: string;
}

const sessions: Session[] = [
  {
    id: 'sess-sage50-1',
    title: 'Sage 50 Session 1',
    date: '2026-08-04',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    code: 'BP05-2504-0001',
    type: 'green',
    status: 'upcoming',
    instructor: 'Arslan M',
    mode: 'Online',
    description:
      'This session covers the essentials of Sage 50 including company setup, chart of accounts, and basic transaction entries.',
    attachments: [{ id: 'att-1', name: 'Session_Outline.pdf', sizeLabel: '1.2 MB' }],
    joinUrl: 'https://meet.google.com/kbm-sage50-session1',
  },
  {
    id: 'sess-tk-taxation-1',
    title: 'TK Taxation',
    date: '2026-08-04',
    startTime: '12:30 PM',
    endTime: '02:30 PM',
    code: 'BP05-2504-0001',
    type: 'red',
    status: 'upcoming',
    instructor: 'Kiran F',
    mode: 'Online',
    description: 'An introduction to UK taxation principles for accounting practitioners.',
    attachments: [],
    joinUrl: 'https://meet.google.com/kbm-tk-taxation',
  },
  {
    id: 'sess-quickbooks-1',
    title: 'QuickBooks Session 1',
    date: '2026-08-04',
    startTime: '03:00 PM',
    endTime: '05:00 PM',
    code: 'BP05-2504-0001',
    type: 'amber',
    status: 'upcoming',
    instructor: 'Bilal R',
    mode: 'Online',
    description: 'Get hands-on with QuickBooks invoicing, reconciliation, and reporting.',
    attachments: [],
    joinUrl: 'https://meet.google.com/kbm-quickbooks-session1',
  },
  {
    id: 'sess-vat-orientation-1',
    title: 'VAT & Business Orientation',
    date: '2026-08-05',
    startTime: '02:00 PM',
    endTime: '04:00 PM',
    code: 'BP05-2504-0001',
    type: 'blue',
    status: 'upcoming',
    instructor: 'Arslan M',
    mode: 'In-Person',
    description: 'Orientation covering VAT registration, filing, and general business compliance.',
    attachments: [],
    location: 'KBM Training Centre, 12 Bridge Street, London, EC4V 6DB',
  },
];

function mockDelay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const sessionsApi = {
  list: (): Promise<Session[]> => mockDelay(sessions),
  getById: (id: string): Promise<Session | undefined> =>
    mockDelay(sessions.find((s) => s.id === id)),
};
