import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementsApi, type AnnouncementAudience } from '@/api/announcements';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (audience?: AnnouncementAudience) => ['announcements', audience ?? 'all'] as const,
  detail: (id: string) => ['announcements', id] as const,
};

export function useAnnouncements(audience?: AnnouncementAudience) {
  return useQuery({
    queryKey: announcementKeys.list(audience),
    queryFn: () => announcementsApi.list(audience),
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
