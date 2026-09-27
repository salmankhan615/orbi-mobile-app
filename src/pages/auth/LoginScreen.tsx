import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/custom/Screen';
import { AuthHero } from '@/features/auth/components/AuthHero';
import { useToastStore } from '@/store/useToastStore';
import { useAuth } from '@/hooks/useAuth';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useToastStore((state) => state.show);
  const { login } = useAuth();

  async function handleSignIn() {
    if (!email || !password) {
      showToast('Please enter email and password', 'danger');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Login] Attempting login with:', email);
      await login(email, password);
      // Navigation happens automatically when auth state changes
      console.log('[Login] ✓ Login successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      console.error('[Login] Error:', message);
      showToast(message, 'danger');
    } finally {
      setIsLoading(false);
    }
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
              label={isLoading ? 'Signing in…' : 'Sign In'}
              onPress={handleSignIn}
              disabled={isLoading || !email || !password}
              loading={isLoading}
              style={styles.submit}
            />
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
});
