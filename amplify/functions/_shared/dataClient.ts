import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend-function/runtime';
import type { Schema } from '../../data/resource';

let configured = false;

export async function getDataClient() {
  if (!configured) {
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(process.env as any);
    Amplify.configure(resourceConfig, libraryOptions);
    configured = true;
  }

  return generateClient<Schema>({ authMode: 'iam' }) as any;
}
