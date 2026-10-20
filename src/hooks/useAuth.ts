import { useCallback } from 'react';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';
import { tokenManager } from '@/store/tokenManager';
import { setApiSession } from '@/api/client';
import { authApi } from '@/api/auth';
import { mobileAuthApi } from '@/api/mobileAuth';
import { pushDevicesApi } from '@/api/pushDevices';
import { getDeviceInfo } from '@/api/deviceInfo';
import { stopPushNotificationPolling } from '@/services/pushNotificationHandler';
import {
  clearProactiveRefresh,
  refreshAccessToken,
  scheduleProactiveRefresh,
} from '@/services/tokenRefresh';
import { mapCrmRole, formatRoleLabel, permissionsForRole } from '@/features/auth/mapCrmRole';
import { SESSION_DURATION_MS } from '@/features/auth/permissions';
import type { StaffPermission } from '@/features/auth/permissions';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function idOf(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  const row = asRecord(value);
  if (!row) return '';
  return str(row._id, row.id);
}

/** Map thin mobile-login user payload into AuthUser (before getUser hydrate). */
function mapMobileLoginUser(raw: unknown, fallbackEmail: string): AuthUser {
  const row = asRecord(raw) ?? {};
  const company = asRecord(row.companyId);
  const role = mapCrmRole({
    role: str(row.role),
    type: str(row.type),
    roleId: idOf(row.roleId) || null,
    profileId: idOf(row.profileId) || null,
    emsProfileId: idOf(row.emsProfileId) || null,
  });
  const photo = row.photo;
  const photoUrl = Array.isArray(photo)
    ? str(photo[0])
    : str(row.photoUrl, typeof photo === 'string' ? photo : '');

  return {
    id: idOf(row._id) || idOf(row.id) || fallbackEmail,
    firstName: str(row.name, row.firstName) || 'User',
    lastName: str(row.lname, row.lastName),
    email: str(row.email) || fallbackEmail,
    phone: str(row.phone) || undefined,
    mobile: str(row.mobile) || undefined,
    photoUrl: photoUrl || undefined,
    role,
    roleLabel: formatRoleLabel(str(row.role, row.type), role),
    crmType: str(row.type) || undefined,
    companyId: idOf(company) || idOf(row.companyId) || undefined,
    companyName: str(company?.name, row.companyName) || undefined,
    status: str(row.status) || undefined,
    country: str(row.country) || undefined,
    city: str(row.city) || undefined,
    permissions: permissionsForRole(role) as StaffPermission[],
  };
}

/**
 * Mobile auth actions (login / logout / manual refresh).
 * Proactive refresh + 401 retry live in `tokenRefresh` and are wired from RootNavigator.
 */
export function useAuth() {
  const { user, signIn, signOut } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        console.log('[Auth] Starting login...');
        const device = await getDeviceInfo();
        const normalizedEmail = email.trim().toLowerCase();

        const response = await mobileAuthApi.login({
          email: normalizedEmail,
          password,
          device,
        });

        await tokenManager.save(response.accessToken, response.refreshToken, response.expiresIn);
        setApiSession(null, response.accessToken, { clearJar: true });

        // Prefer full CRM profile + staff EMS permissions; fall back to login payload.
        let nextUser = mapMobileLoginUser(response.user, normalizedEmail);
        try {
          nextUser = await authApi.getUser();
          console.log('[Auth] Hydrated user profile', {
            role: nextUser.role,
            permissions: nextUser.permissions.length,
          });
        } catch (error) {
          console.warn('[Auth] getUser after login failed — using login payload', error);
        }

        // App session lasts 7 days; access token is refreshed independently.
        await signIn(nextUser, Date.now() + SESSION_DURATION_MS, {
          token: response.accessToken,
        });

        scheduleProactiveRefresh(response.expiresIn);

        console.log('[Auth] ✓ Login successful');
        return response;
      } catch (error) {
        console.error('[Auth] Login failed:', error);
        throw error;
      }
    },
    [signIn],
  );

  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Logging out...');

      stopPushNotificationPolling();
      clearProactiveRefresh();

      const device = await getDeviceInfo();
      const accessToken = await tokenManager.getAccessToken();

      if (accessToken) {
        const refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken) {
          await mobileAuthApi.logout({ refreshToken });
        }
        await pushDevicesApi.deregister(device.deviceId, accessToken);
      }

      await tokenManager.clear();
      setApiSession(null, null);
      signOut();

      console.log('[Auth] ✓ Logged out');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      clearProactiveRefresh();
      await tokenManager.clear();
      setApiSession(null, null);
      signOut();
    }
  }, [signOut]);

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    refreshTokens: refreshAccessToken,
  };
}
