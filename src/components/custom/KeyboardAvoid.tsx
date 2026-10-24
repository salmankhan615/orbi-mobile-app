import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, type ViewStyle } from 'react-native';

interface KeyboardAvoidProps {
  children: ReactNode;
  /** Extra offset above the keyboard (e.g. stack header height). */
  offset?: number;
  style?: ViewStyle;
}

/**
 * Lifts form content above the soft keyboard on iOS and Android.
 * Pair with `android.softwareKeyboardLayoutMode: "pan"` in app.json —
 * with `resize`, Android already shrinks the window and padding can double-count.
 */
export function KeyboardAvoid({ children, offset = 0, style }: KeyboardAvoidProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior="padding"
      keyboardVerticalOffset={offset + (Platform.OS === 'android' ? 24 : 0)}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
