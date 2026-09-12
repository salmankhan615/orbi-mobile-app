import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { crmMediaUrl } from '@/api/coursework';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'CourseworkFile'>;

function isVideoFile(type: string, name: string) {
  return type.toUpperCase() === 'VIDEO' || /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(name);
}

function isImageFile(type: string, name: string) {
  return type.toUpperCase() === 'IMAGE' || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(name);
}

/** Office Online / Google Docs viewers for PPT, PDF, Word, etc. (file URL must be publicly reachable). */
function documentPreviewUri(fileUri: string, filename: string): string {
  const name = filename || fileUri;
  if (/\.(pptx?|ppsx?|docx?|xlsx?|xls)(\?|$)/i.test(name)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUri)}`;
  }
  if (/\.(html?|txt|csv)(\?|$)/i.test(name)) {
    return fileUri;
  }
  // PDF and other docs — Google viewer works cross-platform in WebView
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUri)}`;
}

export function CourseworkFileScreen({ navigation, route }: Props) {
  const { url, filename, type } = route.params;
  const insets = useSafeAreaInsets();
  const file = { url, filename, type };
  const uri = crmMediaUrl(file);
  const name = filename || url;
  const isVideo = isVideoFile(type, name);
  const isImage = isImageFile(type, name);
  const previewUri = !isVideo && !isImage && uri ? documentPreviewUri(uri, name) : '';
  const [loading, setLoading] = useState(Boolean(previewUri));
  const [failed, setFailed] = useState(false);

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
          <Image source={{ uri }} style={styles.media} resizeMode="contain" />
        ) : isVideo && uri ? (
          <VideoView player={player} style={styles.media} nativeControls contentFit="contain" />
        ) : previewUri && !failed ? (
          <>
            <WebView
              source={{ uri: previewUri }}
              style={styles.webview}
              originWhitelist={['*']}
              startInLoadingState
              allowsFullscreenVideo
              setSupportMultipleWindows={false}
              onLoadStart={() => {
                setLoading(true);
                setFailed(false);
              }}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              onHttpError={() => {
                setLoading(false);
                setFailed(true);
              }}
            />
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={tokens.colors.textInverse} />
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.fallback}>
            <Ionicons name="document-outline" size={48} color={tokens.colors.textMuted} />
            <Text variant="bodySmall" color="textMuted" style={styles.fallbackText}>
              {failed
                ? 'Could not load preview. The file may be private or unsupported.'
                : 'Preview is not available for this file.'}
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
  },
  media: {
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.xl,
  },
  fallbackText: {
    textAlign: 'center',
  },
});
