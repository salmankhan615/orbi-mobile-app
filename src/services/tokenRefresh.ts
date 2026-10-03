import { setApiSession } from '@/api/client';
import { mobileAuthApi } from '@/api/mobileAuth';
import { tokenManager } from '@/store/tokenManager';

let refreshPromise: Promise<boolean> | null = null;
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
let onRefreshFailed: (() => void) | null = null;

/** Optional: call sign-out when refresh token is dead. */
export function setRefreshFailureHandler(handler: (() => void) | null) {
  onRefreshFailed = handler;
}

type RefreshOptions = {
  /** Default true — sign out when refresh fails. Splash uses false to allow offline fallthrough. */
  signOutOnFailure?: boolean;
};

/**
 * Single-flight access-token refresh. Concurrent callers await the same promise.
 * Returns true when a new access token was stored.
 */
export async function refreshAccessToken(options?: RefreshOptions): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (!refreshToken) {
        console.warn('[Auth] No refresh token available');
        return false;
      }

      console.log('[Auth] Refreshing tokens...');
      const response = await mobileAuthApi.refresh({ refreshToken });
      await tokenManager.save(response.accessToken, response.refreshToken, response.expiresIn);
      setApiSession(null, response.accessToken);
      scheduleProactiveRefresh(response.expiresIn);
      console.log('[Auth] ✓ Tokens refreshed');
      return true;
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  const ok = await refreshPromise;
  if (!ok && options?.signOutOnFailure !== false) {
    onRefreshFailed?.();
  }
  return ok;
}

/** Refresh at ~80% of access-token lifetime so expiry never hits mid-request. */
export function scheduleProactiveRefresh(expiresInSeconds: number) {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }

  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) return;

  const delayMs = Math.max(5_000, Math.floor(expiresInSeconds * 0.8 * 1000));
  console.log('[Auth] Next refresh in', Math.floor(delayMs / 1000), 'seconds');

  refreshTimeout = setTimeout(() => {
    void (async () => {
      const ok = await refreshAccessToken();
      if (!ok) return;
    })();
  }, delayMs);
}

/** Schedule from stored expiry (app cold start / resume). */
export async function scheduleProactiveRefreshFromStorage() {
  const tokens = await tokenManager.load();
  if (!tokens) return;

  const remainingSeconds = (tokens.expiresAt - Date.now()) / 1000;
  if (remainingSeconds <= 60) {
    await refreshAccessToken();
    return;
  }
  scheduleProactiveRefresh(remainingSeconds);
}

export function clearProactiveRefresh() {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
}

/** Ensure we have a usable access token — refresh if expired or near expiry. */
export async function ensureFreshAccessToken(): Promise<boolean> {
  const expired = await tokenManager.isAccessTokenExpired();
  if (!expired) {
    const access = await tokenManager.getAccessToken();
    if (access) {
      setApiSession(null, access);
      return true;
    }
    return false;
  }
  return refreshAccessToken();
}

/**
 * Cold-start path used by the splash screen: always rotate tokens when a
 * refresh token exists, then restore the persisted user session.
 */
export async function bootstrapSessionOnSplash(): Promise<boolean> {
  const tokens = await tokenManager.load();
  if (!tokens) {
    console.log('[Auth] Splash: no stored tokens');
    return false;
  }

  console.log('[Auth] Splash: refreshing session tokens...');
  const refreshed = await refreshAccessToken({ signOutOnFailure: false });
  if (refreshed) {
    const { restoreAuthSession } = await import('@/store/useAuthStore');
    const restored = await restoreAuthSession();
    if (restored) {
      await scheduleProactiveRefreshFromStorage();
      console.log('[Auth] Splash: ✓ session restored after refresh');
    }
    return restored;
  }

  // Refresh failed (offline / transient) — keep going if access token still usable.
  if (tokens.expiresAt > Date.now()) {
    console.warn('[Auth] Splash: refresh failed, using existing access token');
    setApiSession(null, tokens.accessToken);
    const { restoreAuthSession } = await import('@/store/useAuthStore');
    const restored = await restoreAuthSession();
    if (restored) {
      await scheduleProactiveRefreshFromStorage();
    }
    return restored;
  }

  console.log('[Auth] Splash: access expired and refresh failed — clearing session');
  await tokenManager.clear();
  const { clearStoredSession } = await import('@/store/sessionPersistence');
  await clearStoredSession();
  return false;
}
