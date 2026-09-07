import { apiClient, clearApiSession, getApiSession, setApiSession } from '@/api/client';
import { AUTH_API_PREFIX } from '@/api/config';
import {
  ALL_STAFF_PERMISSIONS,
  SESSION_DURATION_MS,
  type UserRole,
} from '@/features/auth/permissions';
import type { AuthUser } from '@/store/useAuthStore';

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
  cookie?: string | null;
  token?: string | null;
}

/** Raw CRM user shape returned by `/api/users/crm/login`. */
interface CrmUser {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lname?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  token?: string;
  profile?: string;
  profileId?: string | null;
  emsProfileId?: string | null;
}

function expiresAt() {
  return Date.now() + SESSION_DURATION_MS;
}

function mapRole(role?: string): UserRole {
  const normalized = (role ?? '').trim().toLowerCase();
  if (!normalized || normalized === 'student' || normalized.includes('student')) {
    return 'student';
  }
  return 'staff';
}

function mapCrmUser(raw: CrmUser, fallbackEmail: string): AuthUser {
  const role = mapRole(raw.role);
  const firstName = (raw.firstName ?? raw.name ?? '').trim() || 'User';
  const lastName = (raw.lastName ?? raw.lname ?? '').trim();

  return {
    id: String(raw._id ?? raw.id ?? fallbackEmail),
    firstName,
    lastName,
    email: raw.email ?? fallbackEmail,
    phone: raw.phone,
    role,
    permissions: role === 'staff' ? ALL_STAFF_PERMISSIONS : [],
  };
}

function isCrmUser(value: unknown): value is CrmUser {
  return Boolean(value) && typeof value === 'object';
}

export const authApi = {
  async login({ email, password }: LoginPayload): Promise<AuthSession> {
    const raw = await apiClient.post<CrmUser | { user?: CrmUser; token?: string }>(
      `${AUTH_API_PREFIX}/login`,
      { email: email.trim().toLowerCase(), password },
      { skipAuth: true },
    );

    const nested = raw && typeof raw === 'object' && 'user' in raw ? raw.user : undefined;
    const userPayload = isCrmUser(nested) ? nested : isCrmUser(raw) ? raw : null;
    if (!userPayload) {
      throw new Error('Login succeeded but no user was returned.');
    }

    const token =
      (typeof userPayload.token === 'string' && userPayload.token) ||
      (raw && typeof raw === 'object' && 'token' in raw && typeof raw.token === 'string'
        ? raw.token
        : null);
    const { cookie } = getApiSession();
    setApiSession(cookie, token);

    return {
      user: mapCrmUser(userPayload, email.trim().toLowerCase()),
      sessionExpiresAt: expiresAt(),
      cookie,
      token,
    };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.get(`${AUTH_API_PREFIX}/logout`);
    } finally {
      clearApiSession();
    }
  },

  async getLoginStatus(): Promise<unknown> {
    return apiClient.get(`${AUTH_API_PREFIX}/loginStatus`);
  },

  async getUser(): Promise<AuthUser> {
    const raw = await apiClient.get<CrmUser>(`${AUTH_API_PREFIX}/getUser`);
    return mapCrmUser(raw, raw.email ?? '');
  },

  async signup({ firstName, lastName, email, password }: SignupPayload): Promise<AuthSession> {
    const raw = await apiClient.post<CrmUser>(
      `${AUTH_API_PREFIX}/register`,
      {
        name: firstName,
        lname: lastName,
        email: email.trim().toLowerCase(),
        password,
      },
      { skipAuth: true },
    );

    const user = mapCrmUser(raw, email.trim().toLowerCase());
    const { cookie } = getApiSession();
    setApiSession(cookie, typeof raw.token === 'string' ? raw.token : null);

    return {
      user: { ...user, role: 'student', permissions: [] },
      sessionExpiresAt: expiresAt(),
      cookie,
      token: typeof raw.token === 'string' ? raw.token : null,
    };
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post(
      `${AUTH_API_PREFIX}/forgotPassword`,
      { email: email.trim().toLowerCase() },
      { skipAuth: true },
    );
  },

  async resetPassword(payload: { token: string; password: string }): Promise<void> {
    await apiClient.patch(
      `${AUTH_API_PREFIX}/resetPassword/${payload.token}`,
      { password: payload.password },
      { skipAuth: true },
    );
  },
};
