import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

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
  const { data, errors } = await client.queries.createPlaidLinkToken();

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  if (!data?.link_token) {
    throw new Error('Plaid did not return a link token.');
  }

  return data;
}

export async function exchangePlaidPublicToken(publicToken: string, metadata: PlaidLinkMetadata) {
  const { data, errors } = await client.mutations.exchangePlaidPublicToken({
    public_token: publicToken,
    institution_id: metadata.institution.institution_id,
    institution_name: metadata.institution.name,
    link_session_id: metadata.link_session_id,
    sandbox_persona: metadata.sandbox_persona,
  });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data;
}

export async function syncPlaidTransactions(plaidItemId?: string | null) {
  const { data, errors } = await client.mutations.syncPlaidTransactions({
    plaid_item_id: plaidItemId,
  });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data;
}
