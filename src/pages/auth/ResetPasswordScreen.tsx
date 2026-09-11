import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { MIN_PASSWORD_LENGTH } from '@/api/auth';
import { authErrorMessage, useResetPassword } from '@/queries/useAuth';
import { useToastStore } from '@/store/useToastStore';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const reset = useResetPassword();
  const showToast = useToastStore((state) => state.show);

  const passwordTooShort = Boolean(password) && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = Boolean(confirm) && password !== confirm;
  const canSubmit =
    password.length >= MIN_PASSWORD_LENGTH && password === confirm && !reset.isPending;

  return (
    <StackScreen title="Reset password" keyboardAvoiding>
      <Text variant="body" color="textSecondary" style={styles.copy}>
        Choose a new password for {route.params.email} (at least {MIN_PASSWORD_LENGTH} characters).
      </Text>
      <TextField
        label="New password"
        icon="lock-closed-outline"
        secure
        value={password}
        onChangeText={setPassword}
        error={passwordTooShort ? `At least ${MIN_PASSWORD_LENGTH} characters` : undefined}
      />
      <TextField
        label="Confirm password"
        icon="lock-closed-outline"
        secure
        value={confirm}
        onChangeText={setConfirm}
        error={mismatch ? 'Passwords do not match' : undefined}
      />
      <Button
        label="Update password"
        loading={reset.isPending}
        disabled={!canSubmit}
        onPress={() =>
          reset.mutate(
            { token: route.params.email, password },
            {
              onSuccess: (message) => {
                showToast(`${message}. Sign in to continue.`, 'success');
                navigation.navigate('Login');
              },
              onError: (error) =>
                showToast(authErrorMessage(error, 'Could not reset password'), 'danger'),
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
