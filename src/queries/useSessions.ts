import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '@/api/sessions';

export const sessionsKeys = {
  all: ['sessions'] as const,
  detail: (id: string) => ['sessions', id] as const,
};

export function useSessions() {
  return useQuery({
    queryKey: sessionsKeys.all,
    queryFn: sessionsApi.list,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionsKeys.detail(id),
    queryFn: () => sessionsApi.getById(id),
    enabled: Boolean(id),
  });
}
