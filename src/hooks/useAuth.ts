import { useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { tokenManager } from '@/store/tokenManager';
import { setApiSession } from '@/api/client';
import { mobileAuthApi } from '@/api/mobileAuth';
import { pushDevicesApi } from '@/api/pushDevices';
import { getDeviceInfo } from '@/api/deviceInfo';
import { stopPushNotificationPolling } from '@/services/pushNotificationHandler';
import {
  clearProactiveRefresh,
  refreshAccessToken,
  scheduleProactiveRefresh,
} from '@/services/tokenRefresh';
import { SESSION_DURATION_MS } from '@/features/auth/permissions';

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

        const response = await mobileAuthApi.login({
          email,
          password,
          device,
        });

        await tokenManager.save(response.accessToken, response.refreshToken, response.expiresIn);
        setApiSession(null, response.accessToken);

        const mappedUser = {
          id: (response.user as any)._id || response.user.id,
          firstName: (response.user as any).name || '',
          lastName: (response.user as any).lname || '',
          email: response.user.email,
          phone: response.user.phone,
          mobile: response.user.mobile,
          photoUrl: Array.isArray((response.user as any).photo)
            ? (response.user as any).photo[0] || ''
            : (response.user as any).photoUrl || '',
          role: ((response.user as any).type === 'student' ? 'student' : 'staff') as
            | 'student'
            | 'staff',
          roleLabel: response.user.role,
          crmType: (response.user as any).type,
          companyId:
            typeof (response.user as any).companyId === 'object'
              ? (response.user as any).companyId._id
              : (response.user as any).companyId,
          companyName:
            typeof (response.user as any).companyId === 'object'
              ? (response.user as any).companyId.name
              : '',
          status: (response.user as any).status,
          country: (response.user as any).country,
          permissions: [] as never[],
        };

        // App session lasts 7 days; access token is refreshed independently.
        signIn(mappedUser, Date.now() + SESSION_DURATION_MS, {
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
