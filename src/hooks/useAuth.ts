import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { tokenManager } from '@/store/tokenManager';
import { setApiSession, setTokenRefreshHandler } from '@/api/client';
import { mobileAuthApi } from '@/api/mobileAuth';
import { pushDevicesApi } from '@/api/pushDevices';
import { getDeviceInfo } from '@/api/deviceInfo';
import { registerPushToken, initializePushNotifications } from '@/services/pushNotifications';

/**
 * Complete mobile auth management.
 * Handles login/refresh/logout with device registration and push.
 * Document: Area 2 - Mobile session management
 */
export function useAuth() {
  const { user, signIn, signOut } = useAuthStore();
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  /**
   * Refresh tokens silently before expiry.
   * Document: Refresh proactively at ~80% of expiresIn rather than waiting for 401
   */
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

      // Save new tokens
      await tokenManager.save(response.accessToken, response.refreshToken, response.expiresIn);
      setApiSession(null, response.accessToken);

      console.log('[Auth] ✓ Tokens refreshed');

      // Schedule next refresh
      scheduleTokenRefresh(response.expiresIn);
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      signOut();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [signOut]);

  /**
   * Schedule automatic token refresh.
   * Document: Refresh at ~80% of expiresIn to avoid race conditions
   */
  const scheduleTokenRefresh = useCallback(
    (expiresIn: number) => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Refresh at 80% of token lifetime (e.g., 48 min for 60-min token)
      const refreshDelay = Math.floor(expiresIn * 0.8 * 1000);
      console.log('[Auth] Next refresh in', Math.floor(refreshDelay / 1000), 'seconds');

      refreshTimeoutRef.current = setTimeout(() => {
        refreshTokens();
      }, refreshDelay);
    },
    [refreshTokens],
  );

  /**
   * Login with email/password and device info.
   * Document: Send the whole device object at login
   */
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

        // Save tokens
        await tokenManager.save(response.accessToken, response.refreshToken, response.expiresIn);
        setApiSession(null, response.accessToken);

        // Push device registration happens later when Expo provides token

        // Map backend response to AuthUser format
        const mappedUser = {
          id: (response.user as any)._id || response.user.id,
          firstName: (response.user as any).name || '',
          lastName: (response.user as any).lname || '',
          email: response.user.email,
          phone: response.user.phone,
          mobile: response.user.mobile,
          photoUrl: Array.isArray((response.user as any).photo)
            ? ((response.user as any).photo[0] || '')
            : (response.user as any).photoUrl || '',
          role: ((response.user as any).type === 'student' ? 'student' : 'staff') as 'student' | 'staff',
          roleLabel: response.user.role,
          crmType: (response.user as any).type,
          companyId: typeof (response.user as any).companyId === 'object'
            ? (response.user as any).companyId._id
            : (response.user as any).companyId,
          companyName: typeof (response.user as any).companyId === 'object'
            ? (response.user as any).companyId.name
            : '',
          status: (response.user as any).status,
          country: (response.user as any).country,
          permissions: [],
        };

        // Update auth store with mapped user
        signIn(mappedUser, Date.now() + response.expiresIn * 1000, {
          token: response.accessToken,
        });

        // Schedule token refresh
        scheduleTokenRefresh(response.expiresIn);

        // Initialize and register push notifications
        try {
          console.log('[Auth] Initializing push notifications...');
          await initializePushNotifications();
          console.log('[Auth] Registering push token...');
          await registerPushToken(response.accessToken);
          console.log('[Auth] ✓ Push notifications set up');
        } catch (error) {
          console.warn('[Auth] Push setup failed (non-blocking):', error);
        }

        console.log('[Auth] ✓ Login successful');
        return response;
      } catch (error) {
        console.error('[Auth] Login failed:', error);
        throw error;
      }
    },
    [signIn, scheduleTokenRefresh],
  );

  /**
   * Logout and revoke session.
   * Document: Logout must also delete the PushDevice row
   */
  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Logging out...');

      // Get device info for deregistration
      const device = await getDeviceInfo();
      const accessToken = await tokenManager.getAccessToken();

      // Revoke refresh token and deregister device
      if (accessToken) {
        const refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken) {
          await mobileAuthApi.logout({ refreshToken });
        }
        await pushDevicesApi.deregister(device.deviceId, accessToken);
      }

      // Clear tokens
      await tokenManager.clear();
      setApiSession(null, null);

      // Clear auth state
      signOut();

      // Cancel scheduled refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      console.log('[Auth] ✓ Logged out');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Always clear local state even if server logout fails
      await tokenManager.clear();
      setApiSession(null, null);
      signOut();
    }
  }, [signOut]);

  /**
   * Restore session from storage on app launch.
   */
  const restoreSession = useCallback(async () => {
    try {
      console.log('[Auth] Restoring session...');
      const tokens = await tokenManager.load();

      if (!tokens) {
        console.log('[Auth] No stored tokens');
        return;
      }

      // Check if tokens are still valid
      if (tokens.expiresAt < Date.now()) {
        console.log('[Auth] Tokens expired, clearing');
        await tokenManager.clear();
        return;
      }

      // Restore tokens
      setApiSession(null, tokens.accessToken);

      // Schedule refresh for remaining time
      const remainingSeconds = (tokens.expiresAt - Date.now()) / 1000;
      if (remainingSeconds > 0) {
        scheduleTokenRefresh(remainingSeconds);
      }

      console.log('[Auth] ✓ Session restored');
    } catch (error) {
      console.error('[Auth] Restore failed:', error);
    }
  }, [scheduleTokenRefresh]);

  /**
   * Set up the refresh handler that API client calls on TOKEN_EXPIRED.
   */
  useEffect(() => {
    setTokenRefreshHandler(refreshTokens);

    return () => {
      setTokenRefreshHandler(null);
    };
  }, [refreshTokens]);

  /**
   * Clean up on unmount and logout.
   */
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
