import { NativeModules } from 'react-native';

type PickedProfileImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
};

export async function pickProfileImage(): Promise<PickedProfileImage | null> {
  if (!hasNativeImagePickerModule()) {
    throw new Error('Image upload needs a rebuilt development app. Run npx expo run:ios, then reopen the simulator app.');
  }

  let ImagePicker: typeof import('expo-image-picker');

  try {
    ImagePicker = await import('expo-image-picker');
  } catch {
    throw new Error('Image upload needs a rebuilt development app. Run npx expo run:ios, then reopen the simulator app.');
  }

  if (
    typeof ImagePicker.requestMediaLibraryPermissionsAsync !== 'function' ||
    typeof ImagePicker.launchImageLibraryAsync !== 'function'
  ) {
    throw new Error('Image upload is unavailable in this build. Run npx expo run:ios, then reopen the simulator app.');
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Allow photo access to upload a profile image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset?.uri) {
    throw new Error('Unable to read the selected image.');
  }

  return {
    uri: asset.uri,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
  };
}

function hasNativeImagePickerModule() {
  return Boolean(
    NativeModules.ExponentImagePicker ||
    NativeModules.ExpoImagePicker ||
    NativeModules.ImagePicker
  );
}
