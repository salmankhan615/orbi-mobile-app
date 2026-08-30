import { tokens } from '@/theme';

export interface EventCalendar {
  id: string;
  name: string;
  accentColor: keyof typeof tokens.colors;
}

const calendars: EventCalendar[] = [
  { id: 'all', name: 'All calendars', accentColor: 'primary' },
  { id: 'acca', name: 'ACCA Skills', accentColor: 'secondary' },
  { id: 'sage50', name: 'Sage 50', accentColor: 'success' },
  { id: 'quickbooks', name: 'QuickBooks', accentColor: 'warning' },
  { id: 'training', name: 'Training', accentColor: 'tertiary' },
];

function mockDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const calendarsApi = {
  list: (): Promise<EventCalendar[]> => mockDelay(calendars),
  getById: (id: string): Promise<EventCalendar | undefined> =>
    mockDelay(calendars.find((calendar) => calendar.id === id)),
};
