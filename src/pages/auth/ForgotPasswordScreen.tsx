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

  return (
    <StackScreen title="Forgot password" keyboardAvoiding>
      <Text variant="body" color="textSecondary" style={styles.copy}>
        Enter the email on your KBM account. We will send a reset link — same 7-day session rules as
        the web app once you sign back in.
      </Text>
      <TextField
        label="Email"
        icon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />
      <Button
        label={request.isPending ? 'Sending…' : 'Send reset link'}
        disabled={!email || request.isPending}
        onPress={() =>
          request.mutate(email, {
            onSuccess: (message) => {
              showToast(message, 'success');
              navigation.navigate('ResetPassword', { email });
            },
            onError: (error) =>
              showToast(authErrorMessage(error, 'Could not send reset email'), 'danger'),
          })
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
