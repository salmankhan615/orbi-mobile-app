import { Platform } from 'react-native';
import type { AuthUser } from '@/store/useAuthStore';

const STORAGE_KEY = 'kbm.auth.session';
const FILE_NAME = 'kbm-auth-session.json';

export interface PersistedSession {
  user: AuthUser;
  sessionExpiresAt: number;
  cookie: string | null;
  token: string | null;
}

let writeChain: Promise<void> = Promise.resolve();

function enqueueWrite(task: () => Promise<void>) {
  writeChain = writeChain.then(task).catch(() => undefined);
  return writeChain;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseSession(raw: unknown): PersistedSession | null {
  if (!isRecord(raw)) return null;
  const user = raw.user;
  if (!isRecord(user)) return null;
  if (typeof user.id !== 'string' || !user.id.trim()) return null;
  if (typeof user.email !== 'string' || !user.email.trim()) return null;
  if (user.role !== 'student' && user.role !== 'staff') return null;
  if (typeof raw.sessionExpiresAt !== 'number' || !Number.isFinite(raw.sessionExpiresAt)) {
    return null;
  }
  const restoredUser = user as unknown as AuthUser;
  if (!Array.isArray(restoredUser.permissions)) {
    restoredUser.permissions = [];
  }

  return {
    user: restoredUser,
    sessionExpiresAt: raw.sessionExpiresAt,
    cookie: typeof raw.cookie === 'string' && raw.cookie ? raw.cookie : null,
    token: typeof raw.token === 'string' && raw.token ? raw.token : null,
  };
}

async function readRaw(): Promise<unknown> {
  if (Platform.OS === 'web') {
    try {
      const value = globalThis.localStorage?.getItem(STORAGE_KEY);
      return value ? (JSON.parse(value) as unknown) : null;
    } catch {
      return null;
    }
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, FILE_NAME);
  if (!file.exists) return null;
  return file.json();
}

async function writeRaw(session: PersistedSession | null) {
  if (Platform.OS === 'web') {
    try {
      if (!session) {
        globalThis.localStorage?.removeItem(STORAGE_KEY);
        return;
      }
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Persistence must not block sign-in or sign-out.
    }
    return;
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, FILE_NAME);
  if (!session) {
    if (file.exists) file.delete();
    return;
  }
  if (!file.exists) {
    file.create();
  }
  file.write(JSON.stringify(session));
}

export async function loadStoredSession(): Promise<PersistedSession | null> {
  try {
    return parseSession(await readRaw());
  } catch {
    return null;
  }
}

export function saveStoredSession(session: PersistedSession) {
  return enqueueWrite(() => writeRaw(session));
}

export function patchStoredSession(patch: Partial<PersistedSession>) {
  return enqueueWrite(async () => {
    const current = parseSession(await readRaw());
    if (!current) return;
    await writeRaw({ ...current, ...patch });
  });
}

export function clearStoredSession() {
  return enqueueWrite(() => writeRaw(null));
}
