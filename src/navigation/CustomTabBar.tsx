import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { haptics } from '@/utils/haptics';

const TAB_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Courses: 'book',
  Calendar: 'calendar',
  Chat: 'chatbubbles',
  Bookings: 'clipboard',
  Groups: 'people',
  More: 'grid',
  Profile: 'person',
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom - 4, tokens.spacing.sm) }]}
    >
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
          <Pressable key={route.key} onPress={handlePress} style={styles.item} hitSlop={6}>
            <Ionicons
              name={focused ? icon : (`${icon}-outline` as keyof typeof Ionicons.glyphMap)}
              size={22}
              color={focused ? tokens.colors.secondary : tokens.colors.textMuted}
            />
            <Text
              variant="caption"
              color={focused ? 'secondary' : 'textMuted'}
              style={focused ? styles.labelActive : styles.label}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
    paddingTop: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontFamily: tokens.fontFamily.medium,
  },
  labelActive: {
    fontFamily: tokens.fontFamily.semibold,
  },
});
