import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/theme';

/** Approximate custom tab bar height (icons + labels + padding). */
const TAB_BAR_HEIGHT = 52;

/** Bottom inset for scroll content on tab-root screens so lists clear the tab bar. */
export function useTabBarPadding() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, tokens.spacing.sm) + tokens.spacing.md;
}
