import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import 'react-native-gesture-handler';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { tokens } from '@/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '@/queries/queryClient';
import { RootNavigator } from '@/navigation/RootNavigator';
import { rootStyles } from '@/theme/rootStyles';
import { Toast } from '@/components/custom/Toast';
import { appConfigApi } from '@/api/appConfig';
import { UpdateScreen } from '@/pages/common/UpdateScreen';
import type { MobileConfig } from '@/api/appConfig';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: tokens.colors.primary,
    background: tokens.colors.background,
    card: tokens.colors.surface,
    text: tokens.colors.textPrimary,
    border: tokens.colors.border,
    notification: tokens.colors.tertiary,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [sessionReady, setSessionReady] = useState(false);
  const [appConfig, setAppConfig] = useState<MobileConfig | null>(null);
  const [versionChecked, setVersionChecked] = useState(false);

  // Check app version on launch
  useEffect(() => {
    const checkVersion = async () => {
      try {
        console.log('[App] Checking app version...');
        const config = await appConfigApi.getConfig();
        setAppConfig(config);
        setVersionChecked(true);
      } catch (error) {
        console.error('[App] Version check error:', error);
        setVersionChecked(true); // Proceed anyway
      }
    };

    void checkVersion();
  }, []);

  // Restore session from storage on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log('[App] Restoring auth session...');
        const { tokenManager } = await import('@/store/tokenManager');
        const tokens = await tokenManager.load();

        if (tokens && tokens.expiresAt > Date.now()) {
          // Tokens are still valid
          const { setApiSession } = await import('@/api/client');
          setApiSession(null, tokens.accessToken);
          console.log('[App] ✓ Session restored');
        }
      } catch (error) {
        console.error('[App] Session restore error:', error);
      } finally {
        setSessionReady(true);
      }
    };

    void restoreSession();
  }, []);

  const ready = fontsLoaded && sessionReady && versionChecked;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  // Show update screen if version not supported
  if (appConfig && !appConfigApi.isVersionSupported('1.0.0', appConfig.minSupportedVersion)) {
    return (
      <GestureHandlerRootView style={rootStyles.flexFill}>
        <SafeAreaProvider>
          <UpdateScreen
            minVersion={appConfig.minSupportedVersion}
            storeUrls={appConfig.storeUrls}
            message={appConfig.updateMessage}
          />
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={rootStyles.flexFill} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer theme={navTheme}>
            <RootNavigator appConfig={appConfig} />
            <Toast />
            <StatusBar style="dark" />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
