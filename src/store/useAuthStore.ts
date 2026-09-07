import { create } from 'zustand';
import { clearApiSession, setApiSession } from '@/api/client';
import type { StaffPermission, UserRole } from '@/features/auth/permissions';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions: StaffPermission[];
}

export function displayName(user: Pick<AuthUser, 'firstName' | 'lastName'> | null | undefined) {
  if (!user) return 'Guest';
  return `${user.firstName} ${user.lastName}`.trim();
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null;
  signIn: (
    user: AuthUser,
    sessionExpiresAt: number,
    session?: { cookie?: string | null; token?: string | null },
  ) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  sessionExpiresAt: null,
  signIn: (user, sessionExpiresAt, session) => {
    if (session) {
      setApiSession(session.cookie ?? null, session.token ?? null);
    }
    set({ user, isAuthenticated: true, sessionExpiresAt });
  },
  updateUser: (patch) =>
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),
  signOut: () => {
    clearApiSession();
    set({ user: null, isAuthenticated: false, sessionExpiresAt: null });
  },
}));
