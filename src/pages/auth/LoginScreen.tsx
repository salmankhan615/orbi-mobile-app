import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/custom/Screen';
import { AuthHero } from '@/features/auth/components/AuthHero';
import { loginErrorMessage, useLogin } from '@/queries/useAuth';
import { useToastStore } from '@/store/useToastStore';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const showToast = useToastStore((state) => state.show);

  function handleSignIn() {
    login.mutate(
      { email, password },
      {
        onError: (error) => showToast(loginErrorMessage(error), 'danger'),
      },
    );
  }

  return (
    <Screen edges={['top', 'bottom']} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHero title="Welcome back" subtitle="Sign in as a student or staff member." />

          <View style={styles.card}>
            <TextField
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              label="Password"
              icon="lock-closed-outline"
              placeholder="••••••••"
              secure
              value={password}
              onChangeText={setPassword}
            />

            <Text
              variant="caption"
              color="secondary"
              style={styles.forgot}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              Forgot password?
            </Text>

            <Button
              label={login.isPending ? 'Signing in…' : 'Sign In'}
              onPress={handleSignIn}
              disabled={login.isPending || !email || !password}
              loading={login.isPending}
              style={styles.submit}
            />

            <View style={styles.footer}>
              <Text variant="bodySmall" color="textSecondary">
                Don&apos;t have an account?{' '}
              </Text>
              <Text
                variant="bodySmall"
                color="primary"
                style={styles.link}
                onPress={() => navigation.navigate('Signup')}
              >
                Sign Up
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xxxl,
  },
  card: {
    paddingHorizontal: tokens.spacing.xl,
    marginTop: tokens.spacing.sm,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: tokens.spacing.md,
    fontFamily: tokens.fontFamily.semibold,
  },
  submit: {
    marginTop: tokens.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: tokens.spacing.xl,
  },
  link: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
