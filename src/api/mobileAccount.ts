import { apiClient } from '@/api/client';

export type MobileFeatures = {
  showAppAccountDelete: boolean;
};

/**
 * App Store / Play account-deletion gate.
 * `GET /api/mobile/features` — call when account settings opens; do not cache.
 */
export async function getMobileFeatures(): Promise<MobileFeatures> {
  const raw = await apiClient.get<MobileFeatures>('/api/mobile/features');
  return {
    showAppAccountDelete: Boolean(raw?.showAppAccountDelete),
  };
}

/**
 * Soft-delete the signed-in student account (moves to trash).
 * `DELETE /api/mobile/account` — no body; always acts on the Bearer subject.
 */
export async function deleteMobileAccount(): Promise<{ success?: boolean; message?: string }> {
  return apiClient.delete<{ success?: boolean; message?: string }>('/api/mobile/account');
}
