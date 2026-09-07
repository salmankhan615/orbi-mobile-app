/**
 * ORBI CRM API origin. Set via `.env`:
 *   EXPO_PUBLIC_API_URL=https://www.orbierp.com
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://www.orbierp.com').replace(
  /\/$/,
  '',
);

/** Auth routes under the CRM users service. */
export const AUTH_API_PREFIX = '/api/users/crm';
