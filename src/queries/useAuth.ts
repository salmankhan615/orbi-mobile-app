import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { bootstrapKeys } from '@/queries/useBootstrap';
import { coursesKeys } from '@/queries/useCourses';
import { useAuthStore } from '@/store/useAuthStore';

export const authKeys = {
  user: ['auth', 'user'] as const,
};

export function useCrmUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);

  return useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      const user = await authApi.getUser();
      updateUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

async function hydrateAfterSignIn(
  queryClient: ReturnType<typeof useQueryClient>,
  user: { id: string; companyId?: string },
) {
  await queryClient.invalidateQueries({ queryKey: ['courses'] });
  if (user.companyId) {
    await queryClient.prefetchQuery({
      queryKey: coursesKeys.allocatedPacks(user.id, user.companyId),
      queryFn: async () => {
        const { getAllocatedCourses } = await import('@/api/crm');
        const { unwrapList } = await import('@/api/unwrap');
        return unwrapList(await getAllocatedCourses(user.id, user.companyId!));
      },
    });
  }
  await queryClient.prefetchQuery({
    queryKey: bootstrapKeys.student(user.id),
    queryFn: async () => {
      const { fetchStudentBootstrap } = await import('@/api/bootstrap');
      return fetchStudentBootstrap();
    },
  });
}

export function useLogin() {
  const signIn = useAuthStore((state) => state.signIn);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async ({ user, sessionExpiresAt, cookie, token }) => {
      signIn(user, sessionExpiresAt, { cookie, token });
      await hydrateAfterSignIn(queryClient, user);
    },
  });
}

export function useSignup() {
  const signIn = useAuthStore((state) => state.signIn);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: async ({ user, sessionExpiresAt, cookie, token }) => {
      signIn(user, sessionExpiresAt, { cookie, token });
      await hydrateAfterSignIn(queryClient, user);
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: authApi.requestPasswordReset,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: authApi.resetPassword,
  });
}

export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Sign in failed. Please try again.';
}
