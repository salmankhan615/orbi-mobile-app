import { useContext } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { haptics } from '@/utils/haptics';
import { systemNavInset } from '@/navigation/tabBarMetrics';

const TAB_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Courses: 'book',
  Calendar: 'calendar',
  Chat: 'chatbubbles',
  Bookings: 'clipboard',
  Groups: 'people',
  Profile: 'person',
};

export function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const bottomInset = systemNavInset(insets.bottom);

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
    >
      <View style={styles.dock} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = (options.title ?? route.name) as string;
          const focused = state.index === index;
          const icon = TAB_ICON[route.name] ?? 'ellipse';

          function handlePress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              haptics.select();
              navigation.navigate(route.name);
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={handlePress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.item,
                pressed && !focused ? styles.itemPressed : null,
              ]}
            >
              <Ionicons
                name={focused ? icon : (`${icon}-outline` as keyof typeof Ionicons.glyphMap)}
                size={22}
                color={focused ? tokens.colors.secondary : tokens.colors.textMuted}
              />
              <Text
                variant="caption"
                color={focused ? 'secondary' : 'textMuted'}
                numberOfLines={1}
                style={focused ? styles.labelActive : styles.label}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: bottomInset }} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    padding: tokens.spacing.xs,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    ...tokens.shadows.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xxs,
    paddingVertical: tokens.spacing.sm,
  },
  itemPressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: tokens.fontFamily.medium,
    fontSize: tokens.fontSize.xs,
    lineHeight: tokens.lineHeight.xs,
  },
  labelActive: {
    fontFamily: tokens.fontFamily.semibold,
    fontSize: tokens.fontSize.xs,
    lineHeight: tokens.lineHeight.xs,
  },
});
