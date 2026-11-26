import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Logo } from '@/components/ui/Logo';
import { StackScreen } from '@/components/custom/StackScreen';

const HELP_SUPPORT_URL = 'https://www.orbierp.com/crm/#help-support';
const PRIVACY_POLICY_URL = 'https://www.orbierp.com/crm/#privacy-policy';
const PRIVACY_SECURITY_URL = 'https://www.orbierp.com/crm/#privacy-security';

function FullPageWebView({ uri }: { uri: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.webviewWrap}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        originWhitelist={['*']}
        startInLoadingState
        setSupportMultipleWindows={false}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={tokens.colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

export function PrivacySecurityScreen() {
  return (
    <StackScreen title="Privacy & Security" scroll={false} padded={false}>
      <FullPageWebView uri={PRIVACY_SECURITY_URL} />
    </StackScreen>
  );
}

export function HelpSupportScreen() {
  return (
    <StackScreen title="Help & Support" scroll={false} padded={false}>
      <FullPageWebView uri={HELP_SUPPORT_URL} />
    </StackScreen>
  );
}

export function PrivacyPolicyScreen() {
  return (
    <StackScreen title="Privacy Policy" scroll={false} padded={false}>
      <FullPageWebView uri={PRIVACY_POLICY_URL} />
    </StackScreen>
  );
}

export function AboutKbmScreen() {
  return (
    <StackScreen title="About Orbi">
      <Logo variant="mark" size="lg" />
      <Text variant="heading" style={styles.h}>
        Orbi
      </Text>
      <Text variant="body" color="textSecondary" style={styles.p}>
        Professional training for accounting, customer care, and digital accounts. This app is for
        learners and staff.
      </Text>
      <Text variant="caption" color="textMuted">
        Version 1.0.0
      </Text>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  webviewWrap: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.background,
  },
  h: {
    marginBottom: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
  p: {
    marginBottom: tokens.spacing.md,
  },
});
