import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { logAwsTableAccess } from './awsDataLog';

const client = generateClient<Schema>();

export type UserFinancialSnapshot = Schema['UserFinancialSnapshot']['type'];

export async function getMyFinancialSnapshot() {
  if (!client.models.UserFinancialSnapshot) {
    console.warn('[FinancialSnapshot] UserFinancialSnapshot model is not available yet. Deploy the Amplify sandbox to update amplify_outputs.json.');
    return null;
  }

  logAwsTableAccess('UserFinancialSnapshot', 'list');
  const { data, errors } = await client.models.UserFinancialSnapshot.list();

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data?.[0] ?? null;
}
