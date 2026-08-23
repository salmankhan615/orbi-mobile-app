import type { AuthUser } from '@/store/useAuthStore';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

// Mock auth backend — swap these bodies for apiClient calls once a real
// endpoint exists; the queries/ hooks that call these won't need to change.
function mockDelay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const authApi = {
  login: ({ email }: LoginPayload): Promise<AuthUser> =>
    mockDelay({ id: 'user-1', name: 'Sidra', email }),
  signup: ({ name, email }: SignupPayload): Promise<AuthUser> =>
    mockDelay({ id: 'user-1', name, email }),
};
