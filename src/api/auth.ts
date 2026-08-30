import type { AuthUser } from '@/store/useAuthStore';
import { ALL_STAFF_PERMISSIONS, SESSION_DURATION_MS } from '@/features/auth/permissions';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthSession {
  user: AuthUser;
  sessionExpiresAt: number;
}

function mockDelay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function expiresAt() {
  return Date.now() + SESSION_DURATION_MS;
}

function resolveLoginUser(email: string): AuthUser {
  const normalized = email.trim().toLowerCase();
  if (normalized.includes('staff')) {
    return {
      id: 'staff-1',
      firstName: 'Arslan',
      lastName: 'Malik',
      email,
      phone: '+44 7700 900123',
      role: 'staff',
      permissions: ALL_STAFF_PERMISSIONS,
    };
  }
  return {
    id: 'user-1',
    firstName: 'Sidra',
    lastName: 'Khan',
    email,
    phone: '+44 7700 900789',
    role: 'student',
    permissions: [],
  };
}

export const authApi = {
  login: ({ email }: LoginPayload): Promise<AuthSession> =>
    mockDelay({ user: resolveLoginUser(email), sessionExpiresAt: expiresAt() }),

  signup: ({ firstName, lastName, email }: SignupPayload): Promise<AuthSession> =>
    mockDelay({
      user: {
        id: 'user-new',
        firstName,
        lastName,
        email,
        role: 'student',
        permissions: [],
      },
      sessionExpiresAt: expiresAt(),
    }),

  requestPasswordReset: (_email: string): Promise<void> => mockDelay(undefined, 600),

  resetPassword: (_payload: { token: string; password: string }): Promise<void> =>
    mockDelay(undefined, 600),
};
