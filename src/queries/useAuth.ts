import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

export function useLogin() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, sessionExpiresAt, cookie, token }) =>
      signIn(user, sessionExpiresAt, { cookie, token }),
  });
}

export function useSignup() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: ({ user, sessionExpiresAt, cookie, token }) =>
      signIn(user, sessionExpiresAt, { cookie, token }),
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
