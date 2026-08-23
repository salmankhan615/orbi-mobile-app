import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';

export function useLogin() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: signIn,
  });
}

export function useSignup() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: signIn,
  });
}
