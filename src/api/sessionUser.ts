import { useAuthStore, type AuthUser } from '@/store/useAuthStore';

export class MissingCompanyError extends Error {
  constructor() {
    super('Missing companyId — sign out and sign in again.');
    this.name = 'MissingCompanyError';
  }
}

/** Student CRM calls that need user + company (attachments, allocate-course, etc.). */
export function requireStudentContext(): {
  user: AuthUser;
  userId: string;
  companyId: string;
} {
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    throw new Error('Not signed in.');
  }
  const companyId = user.companyId?.trim();
  if (!companyId) {
    throw new MissingCompanyError();
  }
  return { user, userId: user.id, companyId };
}

export function requireUserId(): string {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) throw new Error('Not signed in.');
  return userId;
}
