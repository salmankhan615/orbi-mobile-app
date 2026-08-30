import { Platform, type FlatListProps, type ScrollViewProps } from 'react-native';

/** Shared props for buttery vertical scrolling on iOS and Android. */
export const smoothScrollProps: Pick<
  ScrollViewProps,
  | 'decelerationRate'
  | 'showsVerticalScrollIndicator'
  | 'keyboardDismissMode'
  | 'scrollEventThrottle'
  | 'overScrollMode'
  | 'nestedScrollEnabled'
> = {
  decelerationRate: 'normal',
  showsVerticalScrollIndicator: false,
  keyboardDismissMode: 'on-drag',
  scrollEventThrottle: 16,
  nestedScrollEnabled: true,
  ...(Platform.OS === 'android' ? { overScrollMode: 'never' as const } : {}),
};

/** FlatList tuning for smooth, jank-free lists on both platforms. */
export const smoothListProps: Pick<
  FlatListProps<unknown>,
  | 'decelerationRate'
  | 'showsVerticalScrollIndicator'
  | 'keyboardDismissMode'
  | 'scrollEventThrottle'
  | 'overScrollMode'
  | 'removeClippedSubviews'
  | 'maxToRenderPerBatch'
  | 'windowSize'
  | 'initialNumToRender'
> = {
  ...smoothScrollProps,
  removeClippedSubviews: Platform.OS === 'android',
  maxToRenderPerBatch: 12,
  windowSize: 11,
  initialNumToRender: 10,
};
