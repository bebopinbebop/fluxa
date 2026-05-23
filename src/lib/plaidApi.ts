import { generateClient } from 'aws-amplify/data';
import { Platform } from 'react-native';
import type { Schema } from '../../amplify/data/resource';
import { logAwsTableAccess } from './awsDataLog';

const client = generateClient<Schema>();

export type PlaidInstitution = {
  institution_id: string;
  name?: string;
};

export type PlaidAccountMetadata = {
  id: string;
  mask?: string;
  name?: string;
  subtype?: string;
  type?: string;
};

export type PlaidLinkMetadata = {
  institution: PlaidInstitution;
  link_session_id?: string;
  accounts?: PlaidAccountMetadata[];
  sandbox_persona?: string;
};

export async function createPlaidLinkToken() {
  console.log('[PlaidFlow][App:API] createPlaidLinkToken start', {
    platform: Platform.OS,
  });
  logAwsTableAccess('createPlaidLinkToken', 'query');
  const { data, errors } = await client.queries.createPlaidLinkToken({
    platform: Platform.OS,
  });

  if (errors?.length) {
    console.log('[PlaidFlow][App:API] createPlaidLinkToken errors', {
      errors: errors.map((error) => error.message),
    });
    throw new Error(errors[0].message);
  }

  if (!data?.link_token) {
    console.log('[PlaidFlow][App:API] createPlaidLinkToken missing link token');
    throw new Error('Plaid did not return a link token.');
  }

  console.log('[PlaidFlow][App:API] createPlaidLinkToken success', {
    expiration: data.expiration,
    requestId: data.request_id,
    hasLinkToken: Boolean(data.link_token),
  });

  return data;
}

export async function exchangePlaidPublicToken(publicToken: string, metadata: PlaidLinkMetadata) {
  console.log('[PlaidFlow][App:API] exchangePlaidPublicToken start', {
    publicTokenPreview: maskToken(publicToken),
    institutionId: metadata.institution.institution_id,
    institutionName: metadata.institution.name,
    linkSessionId: metadata.link_session_id,
    selectedAccountCount: metadata.accounts?.length ?? 0,
    sandboxPersona: metadata.sandbox_persona,
  });

  logAwsTableAccess('exchangePlaidPublicToken', 'mutation');
  const { data, errors } = await client.mutations.exchangePlaidPublicToken({
    public_token: publicToken,
    institution_id: metadata.institution.institution_id,
    institution_name: metadata.institution.name,
    link_session_id: metadata.link_session_id,
    sandbox_persona: metadata.sandbox_persona,
  });

  if (errors?.length) {
    console.log('[PlaidFlow][App:API] exchangePlaidPublicToken errors', {
      errors: errors.map((error) => error.message),
    });
    throw new Error(errors[0].message);
  }

  console.log('[PlaidFlow][App:API] exchangePlaidPublicToken success', data);

  return data;
}

export async function syncPlaidTransactions(plaidItemId?: string | null) {
  console.log('[PlaidFlow][App:API] syncPlaidTransactions start', {
    plaidItemId,
  });

  logAwsTableAccess('syncPlaidTransactions', 'mutation');
  const { data, errors } = await client.mutations.syncPlaidTransactions({
    plaid_item_id: plaidItemId,
  });

  if (errors?.length) {
    console.log('[PlaidFlow][App:API] syncPlaidTransactions errors', {
      errors: errors.map((error) => error.message),
    });
    throw new Error(errors[0].message);
  }

  console.log('[PlaidFlow][App:API] syncPlaidTransactions success', data);

  return data;
}

export async function calculateUserFinancialSnapshot() {
  console.log('[PlaidFlow][App:API] calculateUserFinancialSnapshot start');
  logAwsTableAccess('calculateUserFinancialSnapshot', 'mutation');
  const { data, errors } = await client.mutations.calculateUserFinancialSnapshot();

  if (errors?.length) {
    console.log('[PlaidFlow][App:API] calculateUserFinancialSnapshot errors', {
      errors: errors.map((error) => error.message),
    });
    throw new Error(errors[0].message);
  }

  console.log('[PlaidFlow][App:API] calculateUserFinancialSnapshot success', data);

  return data;
}

function maskToken(token: string) {
  return `${token.slice(0, 12)}...${token.slice(-6)}`;
}
