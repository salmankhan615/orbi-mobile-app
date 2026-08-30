import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '@/api/sessions';

export const sessionsKeys = {
  all: ['sessions'] as const,
  list: (calendarId?: string) => ['sessions', calendarId ?? 'all'] as const,
  detail: (id: string) => ['sessions', id] as const,
};

export function useSessions(calendarId?: string) {
  return useQuery({
    queryKey: sessionsKeys.list(calendarId),
    queryFn: () => sessionsApi.list(calendarId),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionsKeys.detail(id),
    queryFn: () => sessionsApi.getById(id),
    enabled: Boolean(id),
  });
}
