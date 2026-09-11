import { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { ScalePressable } from '@/components/custom/ScalePressable';
import { StackScreen } from '@/components/custom/StackScreen';
import type { ProfilePhotoFile } from '@/api/auth';
import { jpegProfilePhoto } from '@/features/profile/jpegProfilePhoto';
import { authErrorMessage, useUpdateProfile } from '@/queries/useAuth';
import { useAuthStore, displayPhone } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const save = useUpdateProfile();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [mobile, setMobile] = useState(displayPhone(user));
  const [country, setCountry] = useState(user?.country ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [photo, setPhoto] = useState<ProfilePhotoFile | null>(null);
  const [picking, setPicking] = useState(false);

  const previewUri = photo?.uri || user?.photoUrl;
  const initial = (firstName || user?.firstName || 'G').charAt(0).toUpperCase();

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access to update your profile picture.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (result.canceled || !result.assets[0]) return;

    setPicking(true);
    try {
      setPhoto(await jpegProfilePhoto(result.assets[0]));
    } catch {
      showToast('Could not read that photo. Try a JPEG or PNG.', 'danger');
    } finally {
      setPicking(false);
    }
  }

  function handleSave() {
    save.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: mobile.trim() || undefined,
        mobile: mobile.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        file: photo ?? undefined,
      },
      {
        onSuccess: () => {
          haptics.success();
          showToast('Profile updated', 'success');
          navigation.goBack();
        },
        onError: (error) =>
          showToast(authErrorMessage(error, 'Could not update profile'), 'danger'),
      },
    );
  }

  return (
    <StackScreen title="Edit Profile" keyboardAvoiding>
      <ScalePressable onPress={pickPhoto} style={styles.avatarPress}>
        <View style={styles.avatarRing}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text variant="heading" color="onPrimary">
                {initial}
              </Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color={tokens.colors.onPrimary} />
          </View>
        </View>
        <Text variant="caption" color="secondary" style={styles.photoHint}>
          {picking ? 'Preparing photo…' : photo ? 'New photo ready — tap to change' : 'Optional — tap to change photo'}
        </Text>
      </ScalePressable>

      <View style={styles.formCard}>
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
      </View>
      <Button
        label="Save"
        loading={save.isPending}
        onPress={handleSave}
        disabled={save.isPending || picking || !firstName.trim()}
        style={styles.save}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  avatarPress: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    borderWidth: 2,
    borderColor: tokens.colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: tokens.colors.surfaceAlt,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.surface,
  },
  photoHint: {
    fontFamily: tokens.fontFamily.semibold,
  },
  formCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.sm,
  },
  save: {
    marginTop: tokens.spacing.sm,
  },
});
