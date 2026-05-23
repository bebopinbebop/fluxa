import { getUrl, uploadData } from 'aws-amplify/storage';

export const PROFILE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

type UploadProfileImageInput = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
};

export async function uploadProfileImage(input: UploadProfileImageInput) {
  const contentType = normalizeImageContentType(input.mimeType, input.fileName);

  if (!contentType) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }

  if (input.fileSize && input.fileSize > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error('Choose an image smaller than 8 MB.');
  }

  const response = await fetch(input.uri);
  const blob = await response.blob();

  if (blob.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error('Choose an image smaller than 8 MB.');
  }

  const extension = extensionForContentType(contentType);
  const result = await uploadData({
    path: ({ identityId }) => `profile-images/${identityId}/original/profile-${Date.now()}.${extension}`,
    data: blob,
    options: {
      contentType,
    },
  }).result;

  const originalProfileImageKey = result.path;
  const profileImageKey = originalProfileImageKey
    .replace('/original/', '/processed/')
    .replace(/\.[^.]+$/, '.jpg');

  return {
    originalProfileImageKey,
    profileImageKey,
  };
}

export async function getProfileImageUrl(profileImageKey?: string | null) {
  if (!profileImageKey) {
    return null;
  }

  const result = await getUrl({
    path: profileImageKey,
    options: {
      validateObjectExistence: true,
      expiresIn: 3600,
    },
  });

  return result.url.toString();
}

function normalizeImageContentType(mimeType?: string | null, fileName?: string | null) {
  const normalized = mimeType?.toLowerCase();

  if (normalized === 'image/jpeg' || normalized === 'image/png' || normalized === 'image/webp') {
    return normalized;
  }

  const extension = fileName?.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';

  return null;
}

function extensionForContentType(contentType: string) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}
