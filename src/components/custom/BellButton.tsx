import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { useUnreadNotificationCount } from '@/queries/useNotifications';
import type { RootStackParamList } from '@/navigation/types';

export function BellButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: unread = 0 } = useUnreadNotificationCount();

  return (
    <View>
      <IconButton
        name="notifications-outline"
        background="surfaceAlt"
        onPress={() => navigation.navigate('Notifications')}
      />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text variant="caption" color="onTertiary" style={styles.count}>
            {unread > 9 ? '9+' : String(unread)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: tokens.colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontFamily: tokens.fontFamily.bold,
    fontSize: tokens.fontSize.xs,
    lineHeight: tokens.lineHeight.xs,
  },
});
