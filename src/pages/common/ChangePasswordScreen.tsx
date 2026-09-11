import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { MIN_PASSWORD_LENGTH } from '@/api/auth';
import { authErrorMessage, useChangePassword, useRequestPasswordReset } from '@/queries/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';

export function ChangePasswordScreen() {
  const navigation = useNavigation();
  const email = useAuthStore((state) => state.user?.email ?? '');
  const showToast = useToastStore((state) => state.show);
  const change = useChangePassword();
  const forgot = useRequestPasswordReset();

  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const passwordTooShort = Boolean(password) && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = Boolean(confirm) && password !== confirm;
  const canSave =
    oldPassword.length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirm &&
    !change.isPending;

  function handleChange() {
    change.mutate(
      { oldPassword, password },
      {
        onSuccess: (message) => {
          haptics.success();
          showToast(message, 'success');
          navigation.goBack();
        },
        onError: (error) =>
          showToast(authErrorMessage(error, 'Could not change password'), 'danger'),
      },
    );
  }

  function handleForgot() {
    if (!email) {
      showToast('No email on this account', 'danger');
      return;
    }
    forgot.mutate(email, {
      onSuccess: (message) => {
        haptics.success();
        showToast(message, 'success');
      },
      onError: (error) =>
        showToast(authErrorMessage(error, 'Could not send reset email'), 'danger'),
    });
  }

  return (
    <StackScreen title="Change Password" keyboardAvoiding>
      <Text variant="body" color="textSecondary" style={styles.copy}>
        Enter your current password, then choose a new one (at least {MIN_PASSWORD_LENGTH}{' '}
        characters).
      </Text>
      <TextField
        label="Current password"
        icon="lock-closed-outline"
        secure
        value={oldPassword}
        onChangeText={setOldPassword}
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
        label="Confirm new password"
        icon="lock-closed-outline"
        secure
        value={confirm}
        onChangeText={setConfirm}
        error={mismatch ? 'Passwords do not match' : undefined}
      />
      <Button
        label="Update password"
        loading={change.isPending}
        disabled={!canSave}
        onPress={handleChange}
        style={styles.submit}
      />

      <Text variant="overline" color="textMuted" style={styles.forgotLabel}>
        Forgot password
      </Text>
      <Text variant="bodySmall" color="textSecondary" style={styles.forgotCopy}>
        We will send a reset link to {email || 'your account email'}.
      </Text>
      <Button
        variant="outline"
        label={forgot.isPending ? 'Sending…' : 'Send reset email'}
        loading={forgot.isPending}
        disabled={!email || forgot.isPending}
        onPress={handleForgot}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    marginBottom: tokens.spacing.lg,
  },
  submit: {
    marginTop: tokens.spacing.sm,
  },
  forgotLabel: {
    marginTop: tokens.spacing.xxl,
    marginBottom: tokens.spacing.sm,
    marginLeft: tokens.spacing.xs,
  },
  forgotCopy: {
    marginBottom: tokens.spacing.md,
  },
});
