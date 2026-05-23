import { defineFunction } from '@aws-amplify/backend';

export const processProfileImage = defineFunction({
  name: 'process-profile-image',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 60,
  memoryMB: 1024,
  ephemeralStorageSizeMB: 1024,
});
