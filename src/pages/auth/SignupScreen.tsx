import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/custom/Screen';
import { AuthHero } from '@/features/auth/components/AuthHero';
import { useSignup } from '@/queries/useAuth';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signup = useSignup();

  const canSubmit = Boolean(name && email && password) && !signup.isPending;

  return (
    <Screen edges={['top', 'bottom']} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHero title="Create your account" subtitle="Join KBM to start learning today." />

          <View style={styles.card}>
            <TextField
              label="Full name"
              icon="person-outline"
              placeholder="Jane Doe"
              value={name}
              onChangeText={setName}
            />
            <TextField
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
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

            <Button
              label={signup.isPending ? 'Creating account…' : 'Sign Up'}
              onPress={() => signup.mutate({ name, email, password })}
              disabled={!canSubmit}
              style={styles.submit}
            />

            <View style={styles.footer}>
              <Text variant="bodySmall" color="textSecondary">
                Already have an account?{' '}
              </Text>
              <Text
                variant="bodySmall"
                color="primary"
                style={styles.link}
                onPress={() => navigation.navigate('Login')}
              >
                Sign In
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
