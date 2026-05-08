import type { Schema } from '../../data/resource';
import { getDataClient } from '../_shared/dataClient';
import { getSignedInUser } from '../_shared/event';
import { plaidRequest } from '../_shared/plaid';
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

  const client = await getDataClient();
  const exchange = await plaidRequest<ExchangeResponse>('/item/public_token/exchange', {
    public_token: publicToken,
  });

  const institutionId = event.arguments.institution_id ?? null;
  const institutionName = event.arguments.institution_name ?? null;
  const linkSessionId = event.arguments.link_session_id ?? null;

  const existingItem = await client.models.PlaidItem.listPlaidItemByItem_id({
    item_id: exchange.item_id,
  });
  const existingItemRecord = existingItem.data?.[0];
  const itemInput = {
    owner: user.username,
    ownerSub: user.sub,
    item_id: exchange.item_id,
    institution_id: institutionId,
    institution_name: institutionName,
    link_session_id: linkSessionId,
    status: 'active',
    needs_reauth: false,
    sandbox_persona: event.arguments.sandbox_persona ?? null,
  };

  const itemRecord = existingItemRecord?.id
    ? (await client.models.PlaidItem.update({ id: existingItemRecord.id, ...itemInput })).data
    : (await client.models.PlaidItem.create(itemInput)).data;

  if (!itemRecord?.id) {
    throw new Error('Unable to persist Plaid item.');
  }

  const existingToken = await client.models.PlaidAccessToken.listPlaidAccessTokenByItem_id({
    item_id: exchange.item_id,
  });
  const existingTokenRecord = existingToken.data?.[0];
  const tokenInput = {
    ownerSub: user.sub,
    item_id: exchange.item_id,
    access_token: exchange.access_token,
    environment: process.env.PLAID_ENV ?? 'sandbox',
  };

  if (existingTokenRecord?.id) {
    await client.models.PlaidAccessToken.update({ id: existingTokenRecord.id, ...tokenInput });
  } else {
    await client.models.PlaidAccessToken.create(tokenInput);
  }

  return syncTransactionsForItem({
    accessToken: exchange.access_token,
    client,
    owner: user.username,
    ownerSub: user.sub,
    plaidItemId: exchange.item_id,
    plaidItemRecordId: itemRecord.id,
    cursor: itemRecord.transactions_cursor,
  });
};
