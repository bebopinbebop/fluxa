import { normalizeAccount, normalizeTransaction } from './normalize';
import { plaidRequest, type TransactionsSyncResponse } from './plaid';

type DataClient = any;

type SyncInput = {
  accessToken: string;
  client: DataClient;
  owner: string;
  ownerSub: string;
  plaidItemId: string;
  plaidItemRecordId: string;
  cursor?: string | null;
};

export async function syncTransactionsForItem({
  accessToken,
  client,
  owner,
  ownerSub,
  plaidItemId,
  plaidItemRecordId,
  cursor,
}: SyncInput) {
  let nextCursor = cursor ?? null;
  let hasMore = true;
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;
  let accountCount = 0;

  while (hasMore) {
    const response = await plaidRequest<TransactionsSyncResponse>('/transactions/sync', {
      access_token: accessToken,
      cursor: nextCursor,
      count: 100,
    });

    accountCount = Math.max(accountCount, response.accounts.length);
    await upsertAccounts(client, owner, ownerSub, plaidItemId, response.accounts);
    await upsertTransactions(client, owner, ownerSub, plaidItemId, response.added);
    await upsertTransactions(client, owner, ownerSub, plaidItemId, response.modified);
    await removeTransactions(client, response.removed);

    addedCount += response.added.length;
    modifiedCount += response.modified.length;
    removedCount += response.removed.length;
    nextCursor = response.next_cursor;
    hasMore = response.has_more;
  }

  await client.models.PlaidItem.update({
    id: plaidItemRecordId,
    transactions_cursor: nextCursor,
    last_successful_sync_at: new Date().toISOString(),
    status: 'active',
    needs_reauth: false,
  });

  return {
    plaid_item_id: plaidItemId,
    account_count: accountCount,
    added_count: addedCount,
    modified_count: modifiedCount,
    removed_count: removedCount,
    next_cursor: nextCursor,
  };
}

async function upsertAccounts(
  client: DataClient,
  owner: string,
  ownerSub: string,
  plaidItemId: string,
  accounts: TransactionsSyncResponse['accounts']
) {
  for (const account of accounts) {
    const normalized = normalizeAccount(account);
    const existing = await client.models.PlaidAccount.listPlaidAccountByAccount_id({
      account_id: normalized.account_id,
    });
    const existingAccount = existing.data?.[0];
    const input = {
      ...normalized,
      owner,
      ownerSub,
      plaid_item_id: plaidItemId,
      last_synced_at: new Date().toISOString(),
    };

    if (existingAccount?.id) {
      await client.models.PlaidAccount.update({ id: existingAccount.id, ...input });
    } else {
      await client.models.PlaidAccount.create(input);
    }
  }
}

async function upsertTransactions(
  client: DataClient,
  owner: string,
  ownerSub: string,
  plaidItemId: string,
  transactions: TransactionsSyncResponse['added']
) {
  for (const transaction of transactions) {
    const normalized = normalizeTransaction(transaction);
    const existing = await client.models.PlaidTransaction.listPlaidTransactionByTransaction_id({
      transaction_id: normalized.transaction_id,
    });
    const existingTransaction = existing.data?.[0];
    const input = {
      ...normalized,
      owner,
      ownerSub,
      plaid_item_id: plaidItemId,
      synced_at: new Date().toISOString(),
      removed: false,
    };

    if (existingTransaction?.id) {
      await client.models.PlaidTransaction.update({ id: existingTransaction.id, ...input });
    } else {
      await client.models.PlaidTransaction.create(input);
    }
  }
}

async function removeTransactions(
  client: DataClient,
  removedTransactions: TransactionsSyncResponse['removed']
) {
  for (const transaction of removedTransactions) {
    const existing = await client.models.PlaidTransaction.listPlaidTransactionByTransaction_id({
      transaction_id: transaction.transaction_id,
    });
    const existingTransaction = existing.data?.[0];

    if (existingTransaction?.id) {
      await client.models.PlaidTransaction.update({
        id: existingTransaction.id,
        removed: true,
        synced_at: new Date().toISOString(),
      });
    }
  }
}
