import { useAuthStore } from '@/store/useAuthStore';
import type { StaffPermission } from '@/features/auth/permissions';

export function useHasPermission(permission: StaffPermission) {
  return useAuthStore(
    (state) => state.user?.role === 'staff' && state.user.permissions.includes(permission),
  );
}

export function useIsStaff() {
  return useAuthStore((state) => state.user?.role === 'staff');
}
