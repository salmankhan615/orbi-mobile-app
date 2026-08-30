import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { ScalePressable } from '@/components/custom/ScalePressable';
import {
  useAnnouncement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from '@/queries/useAnnouncements';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useAuthStore, displayName } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import type { AnnouncementAudience } from '@/api/announcements';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'AnnouncementEditor'>;

const AUDIENCES: AnnouncementAudience[] = ['all', 'students', 'staff'];

export function AnnouncementEditorScreen({ route, navigation }: Props) {
  const id = route.params.announcementId;
  const canManage = useHasPermission('manage_announcements');
  const { data: existing } = useAnnouncement(id ?? '');
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setBody(existing.body);
    setAudience(existing.audience);
    setPinned(existing.pinned);
  }, [existing]);

  if (!canManage) {
    return (
      <StackScreen title="Announcements">
        <Text variant="body" color="textMuted">
          You do not have permission to manage announcements.
        </Text>
      </StackScreen>
    );
  }

  function save() {
    if (id) {
      update.mutate(
        { id, patch: { title, body, audience, pinned } },
        {
          onSuccess: () => {
            showToast('Announcement updated', 'success');
            navigation.goBack();
          },
        },
      );
      return;
    }
    create.mutate(
      {
        title,
        body,
        audience,
        pinned,
        author: displayName(user),
      },
      {
        onSuccess: () => {
          showToast('Announcement published', 'success');
          navigation.goBack();
        },
      },
    );
  }

  return (
    <StackScreen title={id ? 'Edit announcement' : 'New announcement'} keyboardAvoiding>
      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Title" />
      <TextField
        label="Body"
        value={body}
        onChangeText={setBody}
        placeholder="Write the announcement…"
      />
      <Text variant="caption" color="textMuted" style={styles.label}>
        Audience
      </Text>
      <View style={styles.row}>
        {AUDIENCES.map((item) => (
          <ScalePressable
            key={item}
            haptic={false}
            onPress={() => setAudience(item)}
            style={audience === item ? styles.chipActive : styles.chip}
          >
            <Text variant="caption" color={audience === item ? 'onSecondary' : 'textSecondary'}>
              {item}
            </Text>
          </ScalePressable>
        ))}
      </View>
      <ScalePressable
        haptic={false}
        onPress={() => setPinned((value) => !value)}
        style={styles.pin}
      >
        <Text variant="bodySmall">{pinned ? 'Pinned' : 'Not pinned'}</Text>
      </ScalePressable>
      <Button
        label={id ? 'Save changes' : 'Publish'}
        onPress={save}
        disabled={!title.trim() || !body.trim() || create.isPending || update.isPending}
        style={styles.save}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surfaceAlt,
  },
  chipActive: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.secondary,
  },
  pin: {
    paddingVertical: tokens.spacing.md,
  },
  save: {
    marginTop: tokens.spacing.lg,
  },
});
