import { apiClient, clearApiSession, getApiSession, setApiSession } from '@/api/client';
import { AUTH_API_PREFIX } from '@/api/config';
import { crmCourseMediaUrl } from '@/api/crmMedia';
import { Platform } from 'react-native';
import { SESSION_DURATION_MS } from '@/features/auth/permissions';
import {
  formatRoleLabel,
  mapCrmRole,
  permissionsForRole,
} from '@/features/auth/mapCrmRole';
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

export const MIN_PASSWORD_LENGTH = 6;

/** Local photo picked for `PATCH /updateUser` multipart field `file`. */
export interface ProfilePhotoFile {
  uri: string;
  name: string;
  type: string;
  blob?: Blob;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phone?: string;
  mobile?: string;
  country?: string;
  city?: string;
  file?: ProfilePhotoFile;
}

export interface AuthSession {
  user: AuthUser;
  sessionExpiresAt: number;
  cookie?: string | null;
  token?: string | null;
}

/** Raw CRM user shape from `/api/users/crm/login` and `getUser`. */
interface CrmUser {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lname?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  role?: string;
  type?: string;
  roleId?: string | null;
  token?: string;
  profile?: string;
  profileId?: string | null;
  emsProfileId?: string | null;
  status?: string;
  country?: string;
  city?: string;
  state?: string;
  street?: string;
  zipCode?: string;
  dateOfBirth?: string;
  website?: string;
  isVerified?: boolean;
  photo?: { url?: string; filename?: string; type?: string }[] | string;
  /** CRM sometimes returns `company` (string id or populated doc) instead of `companyId`. */
  companyId?:
    | string
    | {
        _id?: string;
        $oid?: string;
        name?: string;
        photo?: { url?: string; filename?: string; type?: string }[];
      }
    | null;
  company?: string | { _id?: string; $oid?: string; name?: string } | null;
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

function resolveCompanyName(raw: CrmUser): string | undefined {
  if (raw.companyId && typeof raw.companyId === 'object' && raw.companyId.name) {
    return String(raw.companyId.name).trim() || undefined;
  }
  if (raw.company && typeof raw.company === 'object' && 'name' in raw.company && raw.company.name) {
    return String(raw.company.name).trim() || undefined;
  }
  return undefined;
}

function firstPhotoUrl(
  photos: { url?: string; filename?: string; type?: string }[] | string | undefined,
): string | undefined {
  if (!photos) return undefined;
  if (typeof photos === 'string' && photos.trim()) {
    return crmCourseMediaUrl(photos.trim(), 'IMAGE');
  }
  if (!Array.isArray(photos) || photos.length === 0) return undefined;
  const first = photos[0];
  const key = (first.url || first.filename || '').trim();
  if (!key) return undefined;
  return crmCourseMediaUrl(key, first.type || 'IMAGE');
}

function resolveCompanyPhoto(raw: CrmUser): string | undefined {
  if (raw.companyId && typeof raw.companyId === 'object') {
    return firstPhotoUrl(raw.companyId.photo);
  }
  return undefined;
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

function titleCase(value?: string): string | undefined {
  const raw = (value ?? '').trim();
  if (!raw) return undefined;
  return raw
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function optionalId(value: unknown): string | undefined {
  if (value == null) return undefined;
  const id = asObjectId(value) ?? (typeof value === 'string' ? value.trim() : '');
  return id || undefined;
}

function mapCrmUser(raw: CrmUser, fallbackEmail: string): AuthUser {
  const role = mapCrmRole({
    role: raw.role,
    type: raw.type,
    roleId: optionalId(raw.roleId),
    profileId: optionalId(raw.profileId),
    emsProfileId: optionalId(raw.emsProfileId),
  });
  const firstName = (raw.firstName ?? raw.name ?? '').trim() || 'User';
  const lastName = (raw.lastName ?? raw.lname ?? '').trim();

  return {
    id: String(raw._id ?? raw.id ?? fallbackEmail),
    firstName,
    lastName,
    email: raw.email ?? fallbackEmail,
    phone: (raw.phone || '').trim() || undefined,
    mobile: (raw.mobile || '').trim() || undefined,
    companyId: resolveCompanyId(raw),
    companyName: resolveCompanyName(raw),
    companyPhotoUrl: resolveCompanyPhoto(raw),
    photoUrl: firstPhotoUrl(raw.photo),
    role,
    roleLabel: formatRoleLabel(raw.role || raw.type, role),
    crmType: (raw.type || '').trim() || undefined,
    roleId: optionalId(raw.roleId),
    profileId: optionalId(raw.profileId),
    emsProfileId: optionalId(raw.emsProfileId),
    status: (raw.status || '').trim() || undefined,
    country: titleCase(raw.country),
    city: titleCase(raw.city),
    state: titleCase(raw.state),
    street: (raw.street || '').trim() || undefined,
    zipCode: (raw.zipCode || '').trim() || undefined,
    dateOfBirth: (raw.dateOfBirth || '').trim() || undefined,
    website: (raw.website || '').trim() || undefined,
    isVerified: Boolean(raw.isVerified),
    permissions: permissionsForRole(role),
  };
}

function isCrmUser(value: unknown): value is CrmUser {
  return Boolean(value) && typeof value === 'object';
}

function messageFromPayload(raw: unknown, fallback: string): string {
  if (raw && typeof raw === 'object' && 'message' in raw) {
    const message = (raw as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message.trim();
  }
  return fallback;
}

function appendField(form: FormData, key: string, value?: string) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return;
  form.append(key, trimmed);
}

function appendProfileFile(form: FormData, file: ProfilePhotoFile) {
  // Native RN FormData needs { uri, name, type }. A web Blob/File from the picker
  // is often HEIC — only append blob when we already transcoded to JPEG.
  if (Platform.OS === 'web' && file.blob) {
    form.append('file', file.blob, file.name);
    return;
  }
  form.append('file', {
    uri: file.uri,
    name: file.name || 'profile.jpg',
    type: file.type || 'image/jpeg',
  } as unknown as Blob);
}

function userFromUpdateResponse(raw: unknown, fallbackEmail: string): AuthUser | null {
  try {
    const userPayload = unwrapUserPayload(raw);
    if (!userPayload._id && !userPayload.id && !userPayload.email) return null;
    return mapCrmUser(userPayload, userPayload.email ?? fallbackEmail);
  } catch {
    return null;
  }
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

    // Login payload is thin — getUser has type / roleId / profileIds for reliable RBAC.
    let user = mapCrmUser(userPayload, email.trim().toLowerCase());
    try {
      user = await authApi.getUser();
    } catch {
      // Keep mapped login user if getUser fails (cookie timing / network).
    }

    return {
      user,
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

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    // Always multipart — JSON PATCH leaves multer with no `file` and CRM returns
    // "profile picture not selected". Omit `file` when the photo did not change.
    const form = new FormData();
    appendField(form, 'name', payload.firstName.trim());
    appendField(form, 'lname', payload.lastName.trim());
    appendField(form, 'phone', payload.phone?.trim());
    appendField(form, 'mobile', payload.mobile?.trim());
    appendField(form, 'country', payload.country?.trim());
    appendField(form, 'city', payload.city?.trim());
    if (payload.file) {
      appendProfileFile(form, payload.file);
    }

    const raw = await apiClient.patch<unknown>(`${AUTH_API_PREFIX}/updateUser`, form);
    return userFromUpdateResponse(raw, '') ?? (await authApi.getUser());
  },

  async changePassword(payload: { oldPassword: string; password: string }): Promise<string> {
    const raw = await apiClient.patch<{ message?: string }>(`${AUTH_API_PREFIX}/changePassword`, {
      oldPassword: payload.oldPassword,
      password: payload.password,
    });
    return messageFromPayload(raw, 'Password updated');
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

    const mapped = mapCrmUser(raw, email.trim().toLowerCase());
    const { cookie } = getApiSession();
    // Prefer JWT cookie synthesis after register too when token present.
    setApiSession(cookie, typeof raw.token === 'string' ? raw.token : null);

    return {
      // Self-serve signup is always a student LMS account.
      user: {
        ...mapped,
        role: 'student',
        roleLabel: 'Student',
        permissions: [],
      },
      sessionExpiresAt: expiresAt(),
      cookie: getApiSession().cookie,
      token: typeof raw.token === 'string' ? raw.token : null,
    };
  },

  async requestPasswordReset(email: string): Promise<string> {
    const raw = await apiClient.post<{ message?: string }>(
      `${AUTH_API_PREFIX}/forgotPassword`,
      { email: email.trim().toLowerCase() },
      { skipAuth: true },
    );
    return messageFromPayload(raw, 'Password reset email sent');
  },

  async resetPassword(payload: { token: string; password: string }): Promise<string> {
    const raw = await apiClient.patch<{ message?: string }>(
      `${AUTH_API_PREFIX}/resetPassword/${encodeURIComponent(payload.token)}`,
      { password: payload.password },
      { skipAuth: true },
    );
    return messageFromPayload(raw, 'Password updated');
  },
};
