import type { Schema } from '../../data/resource';
import { getDataClient } from '../_shared/dataClient';
import { logAwsTableAccess } from '../_shared/dataLog';
import { getSignedInUser } from '../_shared/event';
import { plaidRequest } from '../_shared/plaid';
import { calculateUserFinancialSnapshot } from '../_shared/snapshot';
import { syncTransactionsForItem } from '../_shared/sync';

type ExchangeResponse = {
  access_token: string;
  item_id: string;
  request_id: string;
};

export const handler: Schema['exchangePlaidPublicToken']['functionHandler'] = async (event) => {
  const user = getSignedInUser(event);
  const publicToken = event.arguments.public_token;

  if (!publicToken) {
    throw new Error('Missing Plaid public token.');
  }

  console.log('[PlaidFlow][Lambda:exchangePublicToken] start', {
    ownerSub: user.sub,
    username: user.username,
    publicTokenPreview: maskToken(publicToken),
    institutionId: event.arguments.institution_id ?? null,
    institutionName: event.arguments.institution_name ?? null,
    linkSessionId: event.arguments.link_session_id ?? null,
    sandboxPersona: event.arguments.sandbox_persona ?? null,
  });

  const client = await getDataClient();
  console.log('[PlaidFlow][Lambda:exchangePublicToken] data client ready');

  const exchange = await plaidRequest<ExchangeResponse>('/item/public_token/exchange', {
    public_token: publicToken,
  });

  console.log('[PlaidFlow][Lambda:exchangePublicToken] Plaid exchange success', {
    itemId: exchange.item_id,
    requestId: exchange.request_id,
    hasAccessToken: Boolean(exchange.access_token),
  });

  const institutionId = event.arguments.institution_id ?? null;
  const institutionName = event.arguments.institution_name ?? null;
  const linkSessionId = event.arguments.link_session_id ?? null;

  console.log('[PlaidFlow][Lambda:exchangePublicToken] finding existing PlaidItem', {
    itemId: exchange.item_id,
  });

  logAwsTableAccess('PlaidItem', 'listPlaidItemByItem_id');
  const existingItem = await checkedModelOperation(
    'PlaidItem.listPlaidItemByItem_id',
    client.models.PlaidItem.listPlaidItemByItem_id({
      item_id: exchange.item_id,
    })
  );
  const existingItemRecord = existingItem.data?.find((record: any) => record?.ownerSub === user.sub);
  const itemInput = {
    ownerSub: user.sub,
    item_id: exchange.item_id,
    institution_id: institutionId,
    institution_name: institutionName,
    link_session_id: linkSessionId,
    status: 'active',
    needs_reauth: false,
    sandbox_persona: event.arguments.sandbox_persona ?? null,
  };

  console.log('[PlaidFlow][Lambda:exchangePublicToken] PlaidItem write input', {
    ...itemInput,
    existingRecordId: existingItemRecord?.id ?? null,
  });

  let itemResult;
  if (existingItemRecord?.id) {
    logAwsTableAccess('PlaidItem', 'update');
    itemResult = await checkedModelOperation(
      'PlaidItem.update',
      client.models.PlaidItem.update({ id: existingItemRecord.id, ...itemInput })
    );
  } else {
    logAwsTableAccess('PlaidItem', 'create');
    itemResult = await checkedModelOperation('PlaidItem.create', client.models.PlaidItem.create(itemInput));
  }
  const itemRecord = itemResult.data;

  console.log('[PlaidFlow][Lambda:exchangePublicToken] PlaidItem persisted', {
    itemId: exchange.item_id,
    recordId: itemRecord?.id ?? null,
    action: existingItemRecord?.id ? 'update' : 'create',
  });

  if (!itemRecord?.id) {
    throw new Error('Unable to persist Plaid item.');
  }

  console.log('[PlaidFlow][Lambda:exchangePublicToken] finding existing PlaidAccessToken', {
    itemId: exchange.item_id,
  });

  logAwsTableAccess('PlaidAccessToken', 'listPlaidAccessTokenByItem_id');
  const existingToken = await checkedModelOperation(
    'PlaidAccessToken.listPlaidAccessTokenByItem_id',
    client.models.PlaidAccessToken.listPlaidAccessTokenByItem_id({
      item_id: exchange.item_id,
    })
  );
  const existingTokenRecord = existingToken.data?.find((record: any) => record?.ownerSub === user.sub);
  const tokenInput = {
    ownerSub: user.sub,
    item_id: exchange.item_id,
    access_token: exchange.access_token,
    environment: process.env.PLAID_ENV ?? 'sandbox',
  };

  if (existingTokenRecord?.id) {
    logAwsTableAccess('PlaidAccessToken', 'update');
    await checkedModelOperation(
      'PlaidAccessToken.update',
      client.models.PlaidAccessToken.update({ id: existingTokenRecord.id, ...tokenInput })
    );
  } else {
    logAwsTableAccess('PlaidAccessToken', 'create');
    await checkedModelOperation('PlaidAccessToken.create', client.models.PlaidAccessToken.create(tokenInput));
  }

  console.log('[PlaidFlow][Lambda:exchangePublicToken] access token persisted', {
    itemId: exchange.item_id,
    action: existingTokenRecord?.id ? 'update' : 'create',
    environment: tokenInput.environment,
  });

  console.log('[PlaidFlow][Lambda:exchangePublicToken] starting transaction sync', {
    itemId: exchange.item_id,
    hasCursor: Boolean(itemRecord.transactions_cursor),
  });

  const syncResult = await syncTransactionsForItem({
    accessToken: exchange.access_token,
    client,
    owner: user.username,
    ownerSub: user.sub,
    plaidItemId: exchange.item_id,
    plaidItemRecordId: itemRecord.id,
    cursor: itemRecord.transactions_cursor,
  });

  console.log('[PlaidFlow][Lambda:exchangePublicToken] transaction sync complete', syncResult);
  console.log('[PlaidFlow][Lambda:exchangePublicToken] calculating financial snapshot', {
    ownerSub: user.sub,
  });

  await calculateUserFinancialSnapshot({
    client,
    owner: user.username,
    ownerSub: user.sub,
  });

  console.log('[PlaidFlow][Lambda:exchangePublicToken] complete', {
    ownerSub: user.sub,
    itemId: exchange.item_id,
  });

  return syncResult;
};

function maskToken(token: string) {
  return `${token.slice(0, 12)}...${token.slice(-6)}`;
}

async function checkedModelOperation(label: string, operation: Promise<any>) {
  const result = await operation;

  if (result?.errors?.length) {
    console.log(`[PlaidFlow][Lambda:exchangePublicToken] ${label} GraphQL errors`, {
      errors: result.errors.map((error: any) => ({
        message: error.message,
        errorType: error.errorType,
        path: error.path,
      })),
    });
    throw new Error(`${label} failed: ${result.errors[0].message}`);
  }

  console.log(`[PlaidFlow][Lambda:exchangePublicToken] ${label} result`, {
    hasData: Boolean(result?.data),
    dataPreview: sanitizeForLog(result?.data),
  });

  return result;
}

function sanitizeForLog(value: unknown) {
  if (!value) {
    return value;
  }

  return JSON.parse(
    JSON.stringify(value, (key, nestedValue) => {
      if (key === 'access_token') {
        return '[REDACTED]';
      }

      return nestedValue;
    })
  );
}
