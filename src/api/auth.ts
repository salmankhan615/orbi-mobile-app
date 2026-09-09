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
  /** CRM sometimes returns `company` (string id or populated doc) instead of `companyId`. */
  companyId?: string | { _id?: string; $oid?: string } | null;
  company?: string | { _id?: string; $oid?: string } | null;
}

function asObjectId(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'object') {
    const rec = value as { _id?: unknown; $oid?: unknown; id?: unknown };
    const id = rec._id ?? rec.$oid ?? rec.id;
    if (id != null && String(id).trim()) return String(id).trim();
  }
  return undefined;
}

function resolveCompanyId(raw: CrmUser): string | undefined {
  return asObjectId(raw.companyId) ?? asObjectId(raw.company);
}

function unwrapUserPayload(raw: unknown): CrmUser {
  if (!raw || typeof raw !== 'object') {
    throw new Error('No user was returned.');
  }
  const root = raw as Record<string, unknown>;
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return root.data as CrmUser;
  }
  if (root.user && typeof root.user === 'object') {
    return root.user as CrmUser;
  }
  return raw as CrmUser;
}

function expiresAt() {
  return Date.now() + SESSION_DURATION_MS;
}

function mapRole(role?: string): UserRole {
  const normalized = (role ?? '').trim().toLowerCase();
  // Only treat known staff labels as staff — CRM often uses other strings for students.
  if (
    normalized === 'staff' ||
    normalized === 'admin' ||
    normalized === 'trainer' ||
    normalized === 'instructor' ||
    normalized.includes('staff')
  ) {
    return 'staff';
  }
  return 'student';
}

function mapCrmUser(raw: CrmUser & { type?: string; mobile?: string }, fallbackEmail: string): AuthUser {
  const role = mapRole(raw.role ?? raw.type);
  const firstName = (raw.firstName ?? raw.name ?? '').trim() || 'User';
  const lastName = (raw.lastName ?? raw.lname ?? '').trim();

  return {
    id: String(raw._id ?? raw.id ?? fallbackEmail),
    firstName,
    lastName,
    email: raw.email ?? fallbackEmail,
    phone: raw.phone || raw.mobile,
    companyId: resolveCompanyId(raw),
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
    // Always synthesize Cookie: token=<jwt> — CRM requires it; RN often cannot read Set-Cookie.
    setApiSession(null, token);

    return {
      user: mapCrmUser(userPayload, email.trim().toLowerCase()),
      sessionExpiresAt: expiresAt(),
      cookie: getApiSession().cookie,
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
    const raw = await apiClient.get<unknown>(`${AUTH_API_PREFIX}/getUser`);
    const userPayload = unwrapUserPayload(raw);
    return mapCrmUser(userPayload, userPayload.email ?? '');
  },

  async updateProfile(payload: {
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<AuthUser> {
    await apiClient.patch(`${AUTH_API_PREFIX}/updateUser`, {
      name: payload.firstName,
      lname: payload.lastName,
      phone: payload.phone,
    });
    return authApi.getUser();
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
    // Prefer JWT cookie synthesis after register too when token present.
    setApiSession(cookie, typeof raw.token === 'string' ? raw.token : null);

    return {
      user: { ...user, role: 'student', permissions: [] },
      sessionExpiresAt: expiresAt(),
      cookie: getApiSession().cookie,
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
