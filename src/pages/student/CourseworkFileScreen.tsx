import { useCallback } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { crmMediaUrl } from '@/api/coursework';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'CourseworkFile'>;

export function CourseworkFileScreen({ navigation, route }: Props) {
  const { url, filename, type } = route.params;
  const insets = useSafeAreaInsets();
  const file = { url, filename, type };
  const uri = crmMediaUrl(file);
  const isVideo =
    type.toUpperCase() === 'VIDEO' || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(filename || url);
  const isImage =
    type.toUpperCase() === 'IMAGE' || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(filename || url);

  const player = useVideoPlayer(isVideo && uri ? uri : null, (instance) => {
    instance.loop = false;
  });

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text variant="bodySmall" color="textInverse" style={styles.title} numberOfLines={1}>
          {filename}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color={tokens.colors.textInverse} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {isImage && uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        ) : isVideo && uri ? (
          <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
        ) : (
          <View style={styles.fallback}>
            <Ionicons name="document-outline" size={48} color={tokens.colors.textMuted} />
            <Text variant="bodySmall" color="textMuted" style={styles.fallbackText}>
              Preview is not available for this file type.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  title: {
    flex: 1,
    fontFamily: tokens.fontFamily.semibold,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.glassBorder,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.xl,
  },
  fallbackText: {
    textAlign: 'center',
  },
});
