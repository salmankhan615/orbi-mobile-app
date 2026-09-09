import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStudentBootstrap } from '@/api/bootstrap';
import { useAuthStore } from '@/store/useAuthStore';

export const bootstrapKeys = {
  all: ['bootstrap'] as const,
  student: (userId: string) => [...bootstrapKeys.all, 'student', userId] as const,
};

export function useStudentBootstrap() {
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: bootstrapKeys.student(userId ?? 'anonymous'),
    queryFn: fetchStudentBootstrap,
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 60_000,
    retry: 1,
  });
}

/** Prefetch the same post-login APIs the CRM web app hits after sign-in. */
export async function prefetchStudentBootstrap(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  await queryClient.prefetchQuery({
    queryKey: bootstrapKeys.student(userId),
    queryFn: fetchStudentBootstrap,
  });
}
