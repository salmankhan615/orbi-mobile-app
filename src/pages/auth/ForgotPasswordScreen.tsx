import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { useRequestPasswordReset, authErrorMessage } from '@/queries/useAuth';
import { useToastStore } from '@/store/useToastStore';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const request = useRequestPasswordReset();
  const showToast = useToastStore((state) => state.show);

  const trimmed = email.trim().toLowerCase();

  function handleRecover() {
    if (!trimmed) return;
    request.mutate(trimmed, {
      onSuccess: () => {
        showToast('Password reset email sent', 'success');
        navigation.navigate('Login');
      },
      onError: (error) =>
        showToast(authErrorMessage(error, 'Could not send reset email'), 'danger'),
    });
  }

  return (
    <StackScreen title="Recover Password" keyboardAvoiding>
      <Text variant="body" color="textSecondary" style={styles.copy}>
        Enter your email to recover your ID
      </Text>
      <TextField
        label="Email"
        icon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />
      <Button
        label={request.isPending ? 'Sending…' : 'Recover'}
        disabled={!trimmed || request.isPending}
        loading={request.isPending}
        onPress={handleRecover}
        style={styles.submit}
      />
      <Text
        variant="caption"
        color="textMuted"
        style={styles.loginHint}
        onPress={() => navigation.navigate('Login')}
      >
        Don’t have an account?{' '}
        <Text variant="caption" color="secondary" style={styles.loginLink}>
          Login
        </Text>
      </Text>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    marginBottom: tokens.spacing.lg,
  },
  submit: {
    marginTop: tokens.spacing.md,
    alignSelf: 'stretch',
  },
  loginHint: {
    marginTop: tokens.spacing.lg,
    textAlign: 'center',
  },
  loginLink: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
