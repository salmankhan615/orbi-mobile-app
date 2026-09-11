import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [sentTo, setSentTo] = useState<string | null>(null);
  const request = useRequestPasswordReset();
  const showToast = useToastStore((state) => state.show);

  const trimmed = email.trim().toLowerCase();

  function handleSend() {
    if (!trimmed) return;
    request.mutate(trimmed, {
      onSuccess: (message) => {
        setSentTo(trimmed);
        showToast(message, 'success');
      },
      onError: (error) =>
        showToast(authErrorMessage(error, 'Could not send reset email'), 'danger'),
    });
  }

  return (
    <StackScreen title="Forgot password" keyboardAvoiding>
      {sentTo ? (
        <View style={styles.sentCard}>
          <View style={styles.sentIcon}>
            <Ionicons name="mail-open-outline" size={28} color={tokens.colors.secondary} />
          </View>
          <Text variant="title" style={styles.sentTitle}>
            Check your email
          </Text>
          <Text variant="bodySmall" color="textSecondary" style={styles.sentCopy}>
            If an account exists for {sentTo}, we sent a reset link. Open that email, copy the code
            or paste the full link, then set a new password.
          </Text>
          <Button
            label="I have a reset code"
            onPress={() => navigation.navigate('ResetPassword', { email: sentTo })}
            style={styles.submit}
          />
          <Button
            label="Back to sign in"
            variant="outline"
            onPress={() => navigation.navigate('Login')}
            style={styles.secondary}
          />
          <Text
            variant="caption"
            color="secondary"
            style={styles.resend}
            onPress={() => setSentTo(null)}
          >
            Use a different email
          </Text>
        </View>
      ) : (
        <>
          <Text variant="body" color="textSecondary" style={styles.copy}>
            Enter the email on your KBM account. We will email a reset link — you cannot change the
            password until that code is used.
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
            label={request.isPending ? 'Sending…' : 'Send reset link'}
            disabled={!trimmed || request.isPending}
            loading={request.isPending}
            onPress={handleSend}
            style={styles.submit}
          />
        </>
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  copy: {
    marginBottom: tokens.spacing.lg,
  },
  sentCopy: {
    marginBottom: tokens.spacing.lg,
    textAlign: 'center',
  },
  sentCard: {
    alignItems: 'center',
  },
  sentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.lg,
  },
  sentTitle: {
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  submit: {
    marginTop: tokens.spacing.md,
    alignSelf: 'stretch',
  },
  secondary: {
    marginTop: tokens.spacing.sm,
    alignSelf: 'stretch',
  },
  resend: {
    marginTop: tokens.spacing.lg,
    fontFamily: tokens.fontFamily.semibold,
  },
});
