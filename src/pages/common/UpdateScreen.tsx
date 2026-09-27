import { StyleSheet, View, Linking, Pressable } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/custom/Screen';
import { Ionicons } from '@expo/vector-icons';

interface UpdateScreenProps {
  minVersion: string;
  storeUrls: {
    ios: string;
    android: string;
  };
  message?: string;
}

/**
 * Blocking update screen shown when app version is below minimum.
 * Document: HTTP 426 Upgrade Required treatment
 */
export function UpdateScreen({ minVersion, storeUrls, message }: UpdateScreenProps) {
  const handleUpdate = async () => {
    try {
      const url = __DEV__ ? storeUrls.android : storeUrls.ios;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open store:', error);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-download-outline" size={64} color={tokens.colors.primary} />
        </View>

        <Text variant="heading" style={styles.title}>
          Update Required
        </Text>

        <Text variant="body" color="textSecondary" style={styles.description}>
          {message || `A new version is available. Please update to version ${minVersion} or later to continue using the app.`}
        </Text>

        <View style={styles.spacer} />

        <Pressable style={styles.updateButton} onPress={handleUpdate}>
          <Text variant="bodySmall" color="onPrimary" style={styles.updateButtonText}>
            Update Now
          </Text>
        </Pressable>

        <Text variant="caption" color="textMuted" style={styles.footer}>
          This version is no longer supported
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: tokens.spacing.screen,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: tokens.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.xxl,
  },
  title: {
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
    lineHeight: 24,
  },
  spacer: {
    height: tokens.spacing.lg,
  },
  updateButton: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.full,
    marginBottom: tokens.spacing.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  updateButtonText: {
    fontFamily: tokens.fontFamily.semibold,
  },
  footer: {
    textAlign: 'center',
  },
});
