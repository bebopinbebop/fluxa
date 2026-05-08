import type { Schema } from '../../data/resource';
import { getDataClient } from '../_shared/dataClient';
import { getSignedInUser } from '../_shared/event';
import { syncTransactionsForItem } from '../_shared/sync';

export const handler: Schema['syncPlaidTransactions']['functionHandler'] = async (event) => {
  const user = getSignedInUser(event);
  const client = await getDataClient();
  const requestedItemId = event.arguments.plaid_item_id ?? null;
  const items = requestedItemId
    ? await client.models.PlaidItem.listPlaidItemByItem_id({ item_id: requestedItemId })
    : await client.models.PlaidItem.listPlaidItemByOwnerSub({ ownerSub: user.sub });

  let accountCount = 0;
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;
  let syncedItemCount = 0;

  for (const item of items.data ?? []) {
    if (!item?.id || item.ownerSub !== user.sub) {
      continue;
    }

    const tokenResult = await client.models.PlaidAccessToken.listPlaidAccessTokenByItem_id({
      item_id: item.item_id,
    });
    const token = tokenResult.data?.find((record: any) => record?.ownerSub === user.sub);

    if (!token?.access_token) {
      continue;
    }

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
  }

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
