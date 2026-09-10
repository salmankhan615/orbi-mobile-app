import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokens } from '@/theme';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { StackScreen } from '@/components/custom/StackScreen';
import { authApi } from '@/api/auth';
import { authKeys } from '@/queries/useAuth';
import { useAuthStore, displayPhone } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const showToast = useToastStore((state) => state.show);
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [mobile, setMobile] = useState(displayPhone(user));
  const [country, setCountry] = useState(user?.country ?? '');
  const [city, setCity] = useState(user?.city ?? '');

  const save = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: mobile.trim() || undefined,
        mobile: mobile.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
      }),
    onSuccess: (next) => {
      updateUser(next);
      void queryClient.invalidateQueries({ queryKey: authKeys.user });
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
        label="Mobile"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        icon="call-outline"
      />
      <TextField label="Country" value={country} onChangeText={setCountry} />
      <TextField label="City" value={city} onChangeText={setCity} />
      <TextField label="Email" value={user?.email ?? ''} editable={false} />
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
