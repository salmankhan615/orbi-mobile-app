/**
 * ORBI CRM API origin. Set via `.env`:
 *   EXPO_PUBLIC_API_URL=https://www.orbierp.com
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://www.orbierp.com').replace(
  /\/$/,
  '',
);

/**
 * OrbiChat server origin. Set via `.env`:
 *   EXPO_PUBLIC_CHAT_URL=https://chat.orbierp.com
 */
export const CHAT_BASE_URL = (process.env.EXPO_PUBLIC_CHAT_URL ?? 'https://chat.orbierp.com').replace(
  /\/$/,
  '',
);

/** Auth routes under the CRM users service. */
export const AUTH_API_PREFIX = '/api/users/crm';

/** App version for X-App-Version header. */
export const APP_VERSION = '1.0.1';
