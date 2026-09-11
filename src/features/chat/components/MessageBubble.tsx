import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import type { ChatMessage } from '@/api/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: tokens.duration.base,
      easing: tokens.easing.decelerate,
    });
    translateY.value = withTiming(0, {
      duration: tokens.duration.base,
      easing: tokens.easing.decelerate,
    });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Animated.View
      style={[styles.row, message.fromMe ? styles.rowMe : styles.rowThem, animatedStyle]}
    >
      <View style={[styles.bubble, message.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text variant="bodySmall" color={message.fromMe ? 'onPrimary' : 'textPrimary'}>
          {message.text}
        </Text>
      </View>
      <Text variant="caption" color="textMuted" style={styles.time}>
        {time}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    maxWidth: '78%',
    marginBottom: tokens.spacing.md,
  },
  rowMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  rowThem: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
  },
  bubbleMe: {
    backgroundColor: tokens.colors.primary,
    borderBottomRightRadius: tokens.radius.sm,
  },
  bubbleThem: {
    backgroundColor: tokens.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    borderBottomLeftRadius: tokens.radius.sm,
  },
  time: {
    marginTop: tokens.spacing.xxs,
    marginHorizontal: tokens.spacing.xs,
  },
});
