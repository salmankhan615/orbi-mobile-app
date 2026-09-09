import { create } from 'zustand';
import { clearApiSession, setApiSession } from '@/api/client';
import type { StaffPermission, UserRole } from '@/features/auth/permissions';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  /** CRM company id — required for get-allocate-course. */
  companyId?: string;
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
    set((state) => {
      if (!state.user) return state;
      const next = { ...state.user, ...patch };
      // Never wipe a known companyId with an undefined/empty patch value.
      if (!patch.companyId?.trim()) {
        next.companyId = state.user.companyId;
      }
      return { user: next };
    }),
  signOut: () => {
    clearApiSession();
    set({ user: null, isAuthenticated: false, sessionExpiresAt: null });
  },
}));
