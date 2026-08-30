import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { tokens } from '@/theme';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';

export function EditProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const showToast = useToastStore((state) => state.show);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  return (
    <StackScreen title="Edit Profile">
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
        label="Save"
        onPress={() => {
          updateUser({ firstName, lastName, phone });
          showToast('Profile updated', 'success');
        }}
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
