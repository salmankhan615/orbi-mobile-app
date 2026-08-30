import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';

export function useLogin() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, sessionExpiresAt }) => signIn(user, sessionExpiresAt),
  });
}

export function useSignup() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: ({ user, sessionExpiresAt }) => signIn(user, sessionExpiresAt),
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
