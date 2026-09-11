import { useQuery } from '@tanstack/react-query';
import { sessionsApi, type SessionListParams } from '@/api/sessions';

export const sessionsKeys = {
  all: ['sessions'] as const,
  list: (params: SessionListParams) =>
    [
      'sessions',
      params.calendarId ?? 'all',
      params.startDate,
      params.endDate,
    ] as const,
  detail: (id: string) => ['sessions', id] as const,
};

export function useSessions(params: SessionListParams) {
  return useQuery({
    queryKey: sessionsKeys.list(params),
    queryFn: () => sessionsApi.list(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionsKeys.detail(id),
    queryFn: () => sessionsApi.getById(id),
    enabled: Boolean(id),
  });
}
