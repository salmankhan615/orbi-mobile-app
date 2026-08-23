import { PropsWithChildren } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { tokens } from '@/theme';

interface ScreenProps extends PropsWithChildren {
  edges?: readonly Edge[];
  background?: keyof typeof tokens.colors;
  style?: ViewStyle;
}

// Every screen in the app renders with `headerShown: false`, so none of them
// get React Navigation's automatic safe-area handling — without this wrapper,
// content renders under the status bar / notch. Use this instead of a bare
// `<View>` as a screen's root.
export function Screen({
  children,
  edges = ['top'],
  background = 'background',
  style,
}: ScreenProps) {
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: tokens.colors[background] }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
