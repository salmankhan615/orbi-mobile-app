import { StyleSheet, View, ActivityIndicator, Image } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';

const LOGO = require('@/assets/images/logo-mark.png');

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="KBM" />

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={styles.loadingText}>Loading your session</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
  },
  content: {
    alignItems: 'center',
    gap: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.xl,
  },
  logo: {
    width: 160,
    height: 160,
  },
  loaderContainer: {
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: tokens.fontFamily.semibold,
    color: tokens.colors.textMuted,
  },
});
