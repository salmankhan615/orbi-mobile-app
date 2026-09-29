import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { tokenManager } from '@/store/tokenManager';
import { setApiSession, setTokenRefreshHandler } from '@/api/client';
import { mobileAuthApi } from '@/api/mobileAuth';
import { pushDevicesApi } from '@/api/pushDevices';
import { getDeviceInfo } from '@/api/deviceInfo';
import { stopPushNotificationPolling } from '@/services/pushNotificationHandler';

/**
 * Complete mobile auth management.
 * Handles login/refresh/logout with device registration.
 * Push token registration runs via usePushNotifications after auth state updates.
 * Document: Area 2 - Mobile session management
 */
export function useAuth() {
  const { user, signIn, signOut } = useAuthStore();
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshTokens = useCallback(async () => {
    if (isRefreshingRef.current) return;

    try {
      isRefreshingRef.current = true;
      const refreshToken = await tokenManager.getRefreshToken();
      if (!refreshToken) {
        console.warn('[Auth] No refresh token available');
        signOut();
        return;
      }

      console.log('[Auth] Refreshing tokens...');
      const response = await mobileAuthApi.refresh({ refreshToken });

      await tokenManager.save(response.accessToken, response.refreshToken, response.expiresIn);
      setApiSession(null, response.accessToken);

      console.log('[Auth] ✓ Tokens refreshed');
      scheduleTokenRefresh(response.expiresIn);
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      signOut();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [signOut]);

  const scheduleTokenRefresh = useCallback(
    (expiresIn: number) => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const refreshDelay = Math.floor(expiresIn * 0.8 * 1000);
      console.log('[Auth] Next refresh in', Math.floor(refreshDelay / 1000), 'seconds');

      refreshTimeoutRef.current = setTimeout(() => {
        void refreshTokens();
      }, refreshDelay);
    },
    [refreshTokens],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        console.log('[Auth] Starting login...');
        const device = await getDeviceInfo();
        console.log('[Auth] Device:', device);

        const response = await mobileAuthApi.login({
          email,
          password,
          device,
        });

        console.log('[Auth] Login response:', JSON.stringify(response, null, 2));

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

        // Push registration runs in usePushNotifications when isAuthenticated flips true
        signIn(mappedUser, Date.now() + response.expiresIn * 1000, {
          token: response.accessToken,
        });

        scheduleTokenRefresh(response.expiresIn);

        console.log('[Auth] ✓ Login successful');
        return response;
      } catch (error) {
        console.error('[Auth] Login failed:', error);
        throw error;
      }
    },
    [signIn, scheduleTokenRefresh],
  );

  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Logging out...');

      stopPushNotificationPolling();

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

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      console.log('[Auth] ✓ Logged out');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      await tokenManager.clear();
      setApiSession(null, null);
      signOut();
    }
  }, [signOut]);

  const restoreSession = useCallback(async () => {
    try {
      console.log('[Auth] Restoring session...');
      const tokens = await tokenManager.load();

      if (!tokens) {
        console.log('[Auth] No stored tokens');
        return;
      }

      if (tokens.expiresAt < Date.now()) {
        console.log('[Auth] Tokens expired, clearing');
        await tokenManager.clear();
        return;
      }

      setApiSession(null, tokens.accessToken);

      const remainingSeconds = (tokens.expiresAt - Date.now()) / 1000;
      if (remainingSeconds > 0) {
        scheduleTokenRefresh(remainingSeconds);
      }

      console.log('[Auth] ✓ Session restored');
    } catch (error) {
      console.error('[Auth] Restore failed:', error);
    }
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    setTokenRefreshHandler(refreshTokens);
    return () => setTokenRefreshHandler(null);
  }, [refreshTokens]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    restoreSession,
    refreshTokens,
  };
}
