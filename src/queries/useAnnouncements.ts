import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementsApi, type AnnouncementAudience } from '@/api/announcements';
import { useAuthStore } from '@/store/useAuthStore';
import { useAfterInteractions } from '@/hooks/useAfterInteractions';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (audience?: AnnouncementAudience | 'manage') =>
    ['announcements', audience ?? 'all'] as const,
  detail: (id: string) => ['announcements', id] as const,
};

/** Home banner polls `announcements/my` so a new announcement appears without a restart. */
export const ANNOUNCEMENT_POLL_MS = 60_000;

export function useAnnouncements(audience?: AnnouncementAudience, options?: { pollMs?: number }) {
  const role = useAuthStore((state) => state.user?.role ?? 'student');
  const manage = role === 'staff';
  const ready = useAfterInteractions(manage);

  return useQuery({
    queryKey: announcementKeys.list(manage ? 'manage' : audience),
    queryFn: () => (manage ? announcementsApi.listManage() : announcementsApi.list(audience)),
    enabled: ready,
    staleTime: 60_000,
    retry: 1,
    refetchInterval: options?.pollMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: Boolean(options?.pollMs),
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: () => announcementsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useAcknowledgeAnnouncement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsApi.acknowledge(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: announcementKeys.all });
      client.invalidateQueries({ queryKey: ['notifications'] });
      client.invalidateQueries({ queryKey: ['bootstrap'] });
    },
  });
}

export function useCreateAnnouncement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: announcementsApi.create,
    onSuccess: () => client.invalidateQueries({ queryKey: announcementKeys.all }),
  });
}

export function useUpdateAnnouncement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Parameters<typeof announcementsApi.update>[1];
    }) => announcementsApi.update(id, patch),
    onSuccess: () => client.invalidateQueries({ queryKey: announcementKeys.all }),
  });
}

export function useDeleteAnnouncement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsApi.remove(id),
    onSuccess: () => client.invalidateQueries({ queryKey: announcementKeys.all }),
  });
}
