import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/custom/EmptyState';
import type { StaffPermission } from '@/features/auth/permissions';
import { useHasPermission } from '@/hooks/useHasPermission';

type Props = {
  permission: StaffPermission;
  title?: string;
  message?: string;
  children: React.ReactNode;
};

/** Renders children only when the signed-in staff user has `permission`. */
export function PermissionGate({
  permission,
  title = 'Access restricted',
  message = 'Your role does not include this tool.',
  children,
}: Props) {
  const allowed = useHasPermission(permission);
  if (!allowed) {
    return (
      <View style={styles.wrap}>
        <EmptyState icon="lock-closed-outline" title={title} message={message} />
        <Text variant="caption" color="textMuted" style={styles.hint}>
          Ask an administrator if you need {permission.replace(/_/g, ' ')}.
        </Text>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xxl,
  },
  hint: {
    textAlign: 'center',
    marginTop: tokens.spacing.md,
  },
});
