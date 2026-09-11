import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { ProfilePhotoFile } from '@/api/auth';

const MAX_EDGE = 1080;

/**
 * CRM `updateUser` only accepts JPEG/PNG via multipart field `file`.
 * iOS gallery picks are often HEIC (or PNG after crop) — transcode to JPEG.
 */
export async function jpegProfilePhoto(asset: ImagePickerAsset): Promise<ProfilePhotoFile> {
  const width = asset.width || MAX_EDGE;
  const height = asset.height || MAX_EDGE;
  const longest = Math.max(width, height);
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;

  const result = await manipulateAsync(
    asset.uri,
    scale < 1
      ? [{ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } }]
      : [],
    { compress: 0.85, format: SaveFormat.JPEG },
  );

  const file: ProfilePhotoFile = {
    uri: result.uri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  };

  if (Platform.OS === 'web') {
    const response = await fetch(result.uri);
    file.blob = await response.blob();
  }

  return file;
}
