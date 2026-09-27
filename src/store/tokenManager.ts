import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'mobile_access_token';
const REFRESH_TOKEN_KEY = 'mobile_refresh_token';
const TOKEN_EXPIRY_KEY = 'mobile_token_expiry';

// Fallback in-memory storage
let inMemoryTokens: {
  [key: string]: string | null;
} = {
  [ACCESS_TOKEN_KEY]: null,
  [REFRESH_TOKEN_KEY]: null,
  [TOKEN_EXPIRY_KEY]: null,
};

async function secureSetItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
    console.log('[Tokens] Saved to secure storage:', key);
  } catch (error) {
    console.warn('[Tokens] Secure store unavailable, using in-memory storage:', error);
    inMemoryTokens[key] = value;
  }
}

async function secureGetItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn('[Tokens] Secure store read failed, using in-memory:', error);
    return inMemoryTokens[key] || null;
  }
}

async function secureRemoveItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
    console.log('[Tokens] Removed from secure storage:', key);
  } catch (error) {
    console.warn('[Tokens] Secure store delete failed:', error);
    inMemoryTokens[key] = null;
  }
}

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
}

/**
 * Securely manage mobile auth tokens.
 * Document: Store access token in memory/SecureStore, refresh token in SecureStore only
 */
export const tokenManager = {
  /**
   * Save tokens to storage.
   */
  async save(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    try {
      const expiresAt = Date.now() + expiresIn * 1000;
      await Promise.all([
        secureSetItem(ACCESS_TOKEN_KEY, accessToken),
        secureSetItem(REFRESH_TOKEN_KEY, refreshToken),
        secureSetItem(TOKEN_EXPIRY_KEY, String(expiresAt)),
      ]);
      console.log('[Tokens] Saved (expires in', expiresIn, 'seconds)');
    } catch (error) {
      console.error('[Tokens] Failed to save:', error);
      throw error;
    }
  },

  /**
   * Load tokens from storage.
   */
  async load(): Promise<StoredTokens | null> {
    try {
      const [accessToken, refreshToken, expiryStr] = await Promise.all([
        secureGetItem(ACCESS_TOKEN_KEY),
        secureGetItem(REFRESH_TOKEN_KEY),
        secureGetItem(TOKEN_EXPIRY_KEY),
      ]);

      if (!accessToken || !refreshToken || !expiryStr) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiryStr, 10),
      };
    } catch (error) {
      console.error('[Tokens] Failed to load:', error);
      return null;
    }
  },

  /**
   * Get current access token.
   */
  async getAccessToken(): Promise<string | null> {
    return secureGetItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Get current refresh token.
   */
  async getRefreshToken(): Promise<string | null> {
    return secureGetItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Check if access token is expired.
   * Returns true if expired or will expire in next 5 minutes.
   */
  async isAccessTokenExpired(): Promise<boolean> {
    try {
      const expiryStr = await secureGetItem(TOKEN_EXPIRY_KEY);
      if (!expiryStr) return true;

      const expiresAt = parseInt(expiryStr, 10);
      const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
      return expiresAt < fiveMinutesFromNow;
    } catch {
      return true;
    }
  },

  /**
   * Clear all tokens (logout).
   */
  async clear(): Promise<void> {
    try {
      await Promise.all([
        secureRemoveItem(ACCESS_TOKEN_KEY),
        secureRemoveItem(REFRESH_TOKEN_KEY),
        secureRemoveItem(TOKEN_EXPIRY_KEY),
      ]);
      console.log('[Tokens] Cleared');
    } catch (error) {
      console.error('[Tokens] Failed to clear:', error);
    }
  },
};
