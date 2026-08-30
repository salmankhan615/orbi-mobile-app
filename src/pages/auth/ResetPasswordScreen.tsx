import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { useResetPassword } from '@/queries/useAuth';
import { useToastStore } from '@/store/useToastStore';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const reset = useResetPassword();
  const showToast = useToastStore((state) => state.show);

  return (
    <StackScreen title="Reset password">
      <Text variant="body" color="textSecondary" style={styles.copy}>
        Choose a new password for {route.params.email}.
      </Text>
      <TextField
        label="New password"
        icon="lock-closed-outline"
        secure
        value={password}
        onChangeText={setPassword}
      />
      <TextField
        label="Confirm password"
        icon="lock-closed-outline"
        secure
        value={confirm}
        onChangeText={setConfirm}
      />
      <Button
        label={reset.isPending ? 'Saving…' : 'Update password'}
        disabled={!password || password !== confirm || reset.isPending}
        onPress={() =>
          reset.mutate(
            { token: 'mock-token', password },
            {
              onSuccess: () => {
                showToast('Password updated. Sign in to continue.', 'success');
                navigation.navigate('Login');
              },
            },
          )
        }
        style={styles.submit}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    marginBottom: tokens.spacing.lg,
  },
  submit: {
    marginTop: tokens.spacing.md,
  },
});
