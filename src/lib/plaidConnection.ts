import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { logAwsTableAccess } from './awsDataLog';

const client = generateClient<Schema>();

export async function hasConnectedPlaidItems() {
  logAwsTableAccess('PlaidItem', 'list');
  const { data, errors } = await client.models.PlaidItem.list();

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return Boolean(data?.length);
}
