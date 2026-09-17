import { tokens } from '@/theme';

/**
 * Extra scroll inset on tab-root screens. The tab bar already occupies layout
 * space (including the system nav inset), so this is breathing room above it.
 */
export function useTabBarPadding() {
  return tokens.spacing.xl;
}
