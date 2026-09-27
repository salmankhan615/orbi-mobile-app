import { API_BASE_URL, APP_VERSION } from '@/api/config';
import type { AuthUser } from '@/store/useAuthStore';

export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  osVersion?: string;
  appVersion: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  device: DeviceInfo;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: AuthUser;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface LogoutRequest {
  refreshToken: string;
}

/**
 * Mobile auth API — separate from web login to avoid blast radius.
 * Document: Area 2 - Mobile session management
 */
export const mobileAuthApi = {
  /**
   * Login with email/password and device info.
   * Document: POST /api/mobile/auth/login
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('[Auth] Mobile login attempt for:', request.email);
      console.log('[Auth] Device info:', JSON.stringify(request.device, null, 2));
      const response = await fetch(`${API_BASE_URL}/api/mobile/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': APP_VERSION,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      console.log('[Auth] Login response status:', response.status);
      console.log('[Auth] Login response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('[Auth] Login failed:', data.message || data.error);
        throw new Error(data.message || `Login failed (${response.status})`);
      }

      console.log('[Auth] ✓ Login successful');
      return data as LoginResponse;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  },

  /**
   * Refresh tokens silently.
   * Document: POST /api/mobile/auth/refresh
   * Rotates both access and refresh tokens.
   */
  async refresh(request: RefreshRequest): Promise<RefreshResponse> {
    try {
      console.log('[Auth] Refreshing tokens...');
      const response = await fetch(`${API_BASE_URL}/api/mobile/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': APP_VERSION,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        const code = data.code || 'REFRESH_FAILED';
        console.error('[Auth] Refresh failed:', code, data.message);

        // Specific error codes to handle
        if (code === 'REFRESH_TOKEN_EXPIRED') {
          throw new Error('REFRESH_TOKEN_EXPIRED');
        }
        if (code === 'REFRESH_TOKEN_REUSED') {
          throw new Error('REFRESH_TOKEN_REUSED'); // Revoke all sessions
        }

        throw new Error(data.message || 'Token refresh failed');
      }

      console.log('[Auth] ✓ Tokens refreshed');
      return data as RefreshResponse;
    } catch (error) {
      console.error('[Auth] Refresh error:', error);
      throw error;
    }
  },

  /**
   * Logout and revoke the refresh token.
   * Document: POST /api/mobile/auth/logout
   * Deletes push device registration.
   */
  async logout(request: LogoutRequest): Promise<void> {
    try {
      console.log('[Auth] Logging out...');
      const response = await fetch(`${API_BASE_URL}/api/mobile/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': APP_VERSION,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('[Auth] Logout failed:', data.message);
        // Don't throw — local cleanup happens regardless
      }

      console.log('[Auth] ✓ Logged out');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Don't throw — local cleanup happens regardless
    }
  },
};
