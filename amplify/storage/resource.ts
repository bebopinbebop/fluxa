import { defineStorage } from '@aws-amplify/backend';
import { processProfileImage } from '../functions/process-profile-image/resource';

export const storage = defineStorage({
  name: 'fluxaProfileStorage',
  triggers: {
    onUpload: processProfileImage,
  },
  access: (allow) => ({
    'profile-images/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.resource(processProfileImage).to(['read', 'write', 'delete']),
    ],
  }),
});
