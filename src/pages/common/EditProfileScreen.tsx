import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { tokens } from '@/theme';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const showToast = useToastStore((state) => state.show);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const save = useMutation({
    mutationFn: () => authApi.updateProfile({ firstName, lastName, phone }),
    onSuccess: (next) => {
      updateUser(next);
      showToast('Profile updated', 'success');
      navigation.goBack();
    },
    onError: () => showToast('Could not update profile', 'danger'),
  });

  return (
    <StackScreen title="Edit Profile" keyboardAvoiding>
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        icon="call-outline"
      />
      <Button
        label={save.isPending ? 'Saving…' : 'Save'}
        onPress={() => save.mutate()}
        disabled={save.isPending || !firstName.trim()}
        style={styles.save}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  save: {
    marginTop: tokens.spacing.sm,
  },
});
