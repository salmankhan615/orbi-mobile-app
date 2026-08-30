import { useQuery } from '@tanstack/react-query';
import { calendarsApi } from '@/api/calendars';

export const calendarKeys = {
  all: ['calendars'] as const,
  detail: (id: string) => ['calendars', id] as const,
};

export function useCalendars() {
  return useQuery({
    queryKey: calendarKeys.all,
    queryFn: calendarsApi.list,
  });
}

export function useCalendar(id: string) {
  return useQuery({
    queryKey: calendarKeys.detail(id),
    queryFn: () => calendarsApi.getById(id),
    enabled: Boolean(id) && id !== 'all',
  });
}
