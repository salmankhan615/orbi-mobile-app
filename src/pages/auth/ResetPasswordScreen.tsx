import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { MIN_PASSWORD_LENGTH } from '@/api/auth';
import { extractResetToken } from '@/features/auth/resetToken';
import { authErrorMessage, useResetPassword } from '@/queries/useAuth';
import { useToastStore } from '@/store/useToastStore';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const [tokenInput, setTokenInput] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const reset = useResetPassword();
  const showToast = useToastStore((state) => state.show);

  const token = extractResetToken(tokenInput);
  const passwordTooShort = Boolean(password) && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = Boolean(confirm) && password !== confirm;
  const canSubmit =
    token.length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirm &&
    !reset.isPending;

  const emailHint = route.params?.email;

  return (
    <StackScreen title="Reset password" keyboardAvoiding>
      <Text variant="body" color="textSecondary" style={styles.copy}>
        Paste the code from your reset email{emailHint ? ` (${emailHint})` : ''}, or paste the full
        link. Then choose a new password (at least {MIN_PASSWORD_LENGTH} characters).
      </Text>
      <TextField
        label="Reset code or link"
        icon="key-outline"
        autoCapitalize="none"
        autoCorrect={false}
        value={tokenInput}
        onChangeText={setTokenInput}
        placeholder="Paste code or reset URL"
      />
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
            { token, password },
            {
              onSuccess: (message) => {
                showToast(`${message}. Sign in with your new password.`, 'success');
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
