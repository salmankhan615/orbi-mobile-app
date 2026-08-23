import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Logo } from '@/components/ui/Logo';
import { Text } from '@/components/ui/Text';

interface AuthHeroProps {
  title: string;
  subtitle: string;
}

export function AuthHero({ title, subtitle }: AuthHeroProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.logoCard}>
        <Logo variant="full" size="md" />
      </View>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color="textSecondary" style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: tokens.spacing.xxxl,
    paddingBottom: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.screen,
    alignItems: 'center',
  },
  logoCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    marginBottom: tokens.spacing.xxl,
    ...tokens.shadows.sm,
  },
  title: {
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
