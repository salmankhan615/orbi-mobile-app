import { Platform } from 'react-native';
import { API_BASE_URL } from '@/api/config';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip auth cookie/token for public endpoints like login. */
  skipAuth?: boolean;
};

let sessionCookie: string | null = null;
let sessionToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

/** Called once per 401 on an authenticated call — the auth store signs out here. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

/**
 * CRM auth is cookie-based (`Set-Cookie: token=<jwt>; HttpOnly`).
 * React Native often cannot read Set-Cookie, and the native cookie jar can
 * conflict with a manual Cookie header — clear native cookies and always
 * synthesize `Cookie: token=<jwt>` from the login body token.
 */
export function setApiSession(cookie: string | null, token: string | null = null) {
  sessionToken = token;
  if (token) {
    const tokenCookie = `token=${token}`;
    if (cookie && cookie.includes('token=')) {
      sessionCookie = cookie;
    } else if (cookie) {
      sessionCookie = `${cookie}; ${tokenCookie}`;
    } else {
      sessionCookie = tokenCookie;
    }
  } else {
    sessionCookie = cookie;
  }
  void clearNativeCookies();
}

export function clearApiSession() {
  sessionCookie = null;
  sessionToken = null;
  void clearNativeCookies();
}

export function getApiSession() {
  return { cookie: sessionCookie, token: sessionToken };
}

/** Drop native jar cookies so our explicit Cookie header is the only auth. */
function clearNativeCookies(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const networking = require('react-native/Libraries/Network/RCTNetworking').default as {
      clearCookies?: (cb: (cleared: boolean) => void) => void;
    };
    if (typeof networking?.clearCookies !== 'function') return Promise.resolve();
    return new Promise((resolve) => {
      networking.clearCookies?.(() => resolve());
    });
  } catch {
    return Promise.resolve();
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const record = body as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) return record.message;
  if (typeof record.error === 'string' && record.error.trim()) return record.error;
  return fallback;
}

function readSetCookie(response: Response): string | null {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') {
    const cookies = headers.getSetCookie();
    if (cookies?.length) {
      return cookies
        .map((value) => value.split(';')[0]?.trim())
        .filter(Boolean)
        .join('; ');
    }
  }
  const raw = response.headers.get('set-cookie');
  if (!raw) return null;
  return raw
    .split(/,(?=\s*[^;=]+=[^;]+)/)
    .map((part) => part.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isFormDataBody(body: unknown): body is FormData {
  if (!body || typeof body !== 'object') return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true;
  // Hermes can fail `instanceof FormData` across realms — still must not JSON.stringify.
  return typeof (body as FormData).append === 'function';
}

const REQUEST_TIMEOUT_MS = 20_000;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, skipAuth, signal, ...rest } = options;
  const authHeaders: Record<string, string> = {};

  if (!skipAuth) {
    // credentials: 'omit' — do not await jar clears here; that stalled every CRM call.
    const cookie = sessionCookie ?? (sessionToken ? `token=${sessionToken}` : null);
    if (cookie) authHeaders.Cookie = cookie;
  }

  const formData = isFormDataBody(body);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener('abort', onOuterAbort);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      // omit — we send Cookie ourselves; include makes the native jar fight us.
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        // Let fetch set the multipart boundary; JSON is the default for object bodies.
        ...(body !== undefined && !formData ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders,
        ...headers,
      },
      body: body === undefined ? undefined : formData ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new ApiError(`Request to ${path} timed out`, 408);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }

  const setCookie = readSetCookie(response);
  // Prefer server cookie when visible; keep JWT cookie fallback. Skip a
  // `token=` deletion (logout / expiry) so a valid session is not wiped, and
  // skip unchanged cookies so the native jar is not cleared on every call.
  if (setCookie && setCookie !== sessionCookie && !/(^|;\s*)token=(;|$)/.test(setCookie)) {
    setApiSession(setCookie, sessionToken);
  }

  const parsed = await parseBody(response);

  if (response.status === 401 && !skipAuth && (sessionCookie || sessionToken)) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    throw new ApiError(
      messageFromBody(parsed, `Request to ${path} failed (${response.status})`),
      response.status,
      parsed,
    );
  }

  return parsed as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
