import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="school" size={60} color={tokens.colors.primary} />
        </View>

        {/* Brand Name */}
        <View style={styles.brandContainer}>
          <Text style={styles.title}>
            KBM
          </Text>
          <Text style={styles.subtitle}>
            Training & Recruitment
          </Text>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Loading Indicator */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={styles.loadingText}>
            Loading your session
          </Text>
        </View>

        {/* Footer Text */}
        <Text style={styles.footerText}>
          Preparing your experience...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
  },
  content: {
    alignItems: 'center',
    gap: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
    shadowColor: tokens.colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  brandContainer: {
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  title: {
    fontSize: 28,
    fontFamily: tokens.fontFamily.bold,
    color: tokens.colors.primary,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: tokens.fontFamily.semibold,
    color: tokens.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  spacer: {
    height: tokens.spacing.xl,
  },
  loaderContainer: {
    alignItems: 'center',
    gap: tokens.spacing.md,
    marginVertical: tokens.spacing.lg,
  },
  loadingText: {
    marginTop: tokens.spacing.sm,
    fontSize: 12,
    fontFamily: tokens.fontFamily.semibold,
    color: tokens.colors.textMuted,
  },
  footerText: {
    marginTop: tokens.spacing.xl,
    fontSize: 11,
    fontFamily: tokens.fontFamily.regular,
    color: tokens.colors.textMuted,
  },
});
