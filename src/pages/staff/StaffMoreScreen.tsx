import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Screen } from '@/components/custom/Screen';
import { EmptyState } from '@/components/custom/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { MenuRow } from '@/features/profile/components/MenuRow';
import { toolsForPermissions } from '@/features/staff/staffTools';
import { openStaffTool } from '@/features/staff/openStaffTool';
import { useAuthStore } from '@/store/useAuthStore';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { smoothScrollProps } from '@/utils/scroll';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'More'>;

export function StaffMoreScreen({ navigation }: Props) {
  const tabPadding = useTabBarPadding();
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const tools = useMemo(
    () => toolsForPermissions(permissions).filter((tool) => tool.route || tool.tab),
    [permissions],
  );

  return (
    <Screen style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabPadding }]}
        {...smoothScrollProps}
      >
        <PageHeader
          title="Staff tools"
          subtitle="Only modules allowed for your role are listed."
        />
        {tools.length === 0 ? (
          <EmptyState
            icon="grid-outline"
            title="No tools available"
            message="Ask an admin to grant staff module permissions."
          />
        ) : (
          <View style={styles.group}>
            {tools.map((item, index) => (
              <MenuRow
                key={item.id}
                icon={item.icon}
                label={item.label}
                isLast={index === tools.length - 1}
                onPress={() => openStaffTool(navigation, item)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.screen,
    paddingTop: tokens.spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  content: {},
  group: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    ...tokens.shadows.sm,
  },
});
