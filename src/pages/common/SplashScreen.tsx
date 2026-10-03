import { useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Image } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { bootstrapSessionOnSplash } from '@/services/tokenRefresh';

const LOGO = require('@/assets/images/logo-mark.png');

type Props = {
  /** Called once splash auth bootstrap finishes (success or no session). */
  onReady?: () => void;
};

export function SplashScreen({ onReady }: Props) {
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await bootstrapSessionOnSplash();
      } catch (error) {
        console.error('[Splash] Session bootstrap failed:', error);
      } finally {
        if (cancelled || finishedRef.current) return;
        finishedRef.current = true;
        onReady?.();
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [onReady]);

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
