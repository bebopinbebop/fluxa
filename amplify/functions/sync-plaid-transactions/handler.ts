import type { Schema } from '../../data/resource';
import { getDataClient } from '../_shared/dataClient';
import { logAwsTableAccess } from '../_shared/dataLog';
import { getSignedInUser } from '../_shared/event';
import { calculateUserFinancialSnapshot } from '../_shared/snapshot';
import { syncTransactionsForItem } from '../_shared/sync';

export const handler: Schema['syncPlaidTransactions']['functionHandler'] = async (event) => {
  const user = getSignedInUser(event);
  const client = await getDataClient();
  const requestedItemId = event.arguments.plaid_item_id ?? null;

  console.log('[PlaidFlow][Lambda:syncTransactions] start', {
    ownerSub: user.sub,
    username: user.username,
    requestedItemId,
  });

  logAwsTableAccess('PlaidItem', requestedItemId ? 'listPlaidItemByItem_id' : 'listPlaidItemByOwnerSub');
  const items = requestedItemId
    ? await client.models.PlaidItem.listPlaidItemByItem_id({ item_id: requestedItemId })
    : await client.models.PlaidItem.listPlaidItemByOwnerSub({ ownerSub: user.sub });

  console.log('[PlaidFlow][Lambda:syncTransactions] PlaidItems loaded', {
    ownerSub: user.sub,
    itemCount: items.data?.length ?? 0,
  });

  let accountCount = 0;
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;
  let syncedItemCount = 0;

  for (const item of items.data ?? []) {
    if (!item?.id || item.ownerSub !== user.sub) {
      console.log('[PlaidFlow][Lambda:syncTransactions] skipping item not owned by user or missing id', {
        itemId: item?.item_id ?? null,
        recordOwnerSub: item?.ownerSub ?? null,
      });
      continue;
    }

    console.log('[PlaidFlow][Lambda:syncTransactions] loading access token', {
      itemId: item.item_id,
      plaidItemRecordId: item.id,
      hasCursor: Boolean(item.transactions_cursor),
    });

    logAwsTableAccess('PlaidAccessToken', 'listPlaidAccessTokenByItem_id');
    const tokenResult = await client.models.PlaidAccessToken.listPlaidAccessTokenByItem_id({
      item_id: item.item_id,
    });
    const token = tokenResult.data?.find((record: any) => record?.ownerSub === user.sub);

    if (!token?.access_token) {
      console.log('[PlaidFlow][Lambda:syncTransactions] skipping item without access token', {
        itemId: item.item_id,
      });
      continue;
    }

    console.log('[PlaidFlow][Lambda:syncTransactions] syncing item', {
      itemId: item.item_id,
    });

    const result = await syncTransactionsForItem({
      accessToken: token.access_token,
      client,
      owner: user.username,
      ownerSub: user.sub,
      plaidItemId: item.item_id,
      plaidItemRecordId: item.id,
      cursor: item.transactions_cursor,
    });

    accountCount += result.account_count ?? 0;
    addedCount += result.added_count ?? 0;
    modifiedCount += result.modified_count ?? 0;
    removedCount += result.removed_count ?? 0;
    syncedItemCount += 1;

    console.log('[PlaidFlow][Lambda:syncTransactions] item sync complete', result);
  }

  if (syncedItemCount > 0) {
    console.log('[PlaidFlow][Lambda:syncTransactions] calculating financial snapshot', {
      ownerSub: user.sub,
      syncedItemCount,
    });

    await calculateUserFinancialSnapshot({
      client,
      owner: user.username,
      ownerSub: user.sub,
    });
  }

  console.log('[PlaidFlow][Lambda:syncTransactions] complete', {
    ownerSub: user.sub,
    requestedItemId,
    syncedItemCount,
    accountCount,
    addedCount,
    modifiedCount,
    removedCount,
  });

  return {
    plaid_item_id: requestedItemId,
    item_count: syncedItemCount,
    account_count: accountCount,
    added_count: addedCount,
    modified_count: modifiedCount,
    removed_count: removedCount,
    next_cursor: null,
  };
};
