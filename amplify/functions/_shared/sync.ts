import { logAwsTableAccess } from './dataLog';
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
  console.log('[PlaidFlow][Sync] start', {
    ownerSub,
    plaidItemId,
    plaidItemRecordId,
    hasCursor: Boolean(cursor),
  });

  let nextCursor = cursor ?? null;
  let hasMore = true;
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;
  let accountCount = 0;
  let page = 0;

  while (hasMore) {
    page += 1;
    console.log('[PlaidFlow][Sync] requesting Plaid /transactions/sync page', {
      plaidItemId,
      page,
      hasCursor: Boolean(nextCursor),
    });

    const response = await plaidRequest<TransactionsSyncResponse>('/transactions/sync', {
      access_token: accessToken,
      cursor: nextCursor,
      count: 100,
    });

    console.log('[PlaidFlow][Sync] Plaid sync page received', {
      plaidItemId,
      page,
      requestId: response.request_id,
      accountCount: response.accounts.length,
      addedCount: response.added.length,
      modifiedCount: response.modified.length,
      removedCount: response.removed.length,
      hasMore: response.has_more,
      hasNextCursor: Boolean(response.next_cursor),
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

  console.log('[PlaidFlow][Sync] updating PlaidItem cursor', {
    plaidItemId,
    plaidItemRecordId,
    hasNextCursor: Boolean(nextCursor),
    addedCount,
    modifiedCount,
    removedCount,
  });

  logAwsTableAccess('PlaidItem', 'update');
  await client.models.PlaidItem.update({
    id: plaidItemRecordId,
    transactions_cursor: nextCursor,
    last_successful_sync_at: new Date().toISOString(),
    status: 'active',
    needs_reauth: false,
  });

  console.log('[PlaidFlow][Sync] complete', {
    ownerSub,
    plaidItemId,
    accountCount,
    addedCount,
    modifiedCount,
    removedCount,
    hasNextCursor: Boolean(nextCursor),
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
  console.log('[PlaidFlow][Sync] upserting accounts', {
    ownerSub,
    plaidItemId,
    count: accounts.length,
  });

  for (const account of accounts) {
    const normalized = normalizeAccount(account);
    logAwsTableAccess('PlaidAccount', 'listPlaidAccountByAccount_id');
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
      logAwsTableAccess('PlaidAccount', 'update');
      await client.models.PlaidAccount.update({ id: existingAccount.id, ...input });
      console.log('[PlaidFlow][Sync] account updated', {
        plaidItemId,
        accountId: normalized.account_id,
        name: normalized.name,
        type: normalized.type,
        subtype: normalized.subtype,
      });
    } else {
      logAwsTableAccess('PlaidAccount', 'create');
      await client.models.PlaidAccount.create(input);
      console.log('[PlaidFlow][Sync] account created', {
        plaidItemId,
        accountId: normalized.account_id,
        name: normalized.name,
        type: normalized.type,
        subtype: normalized.subtype,
      });
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
  console.log('[PlaidFlow][Sync] upserting transactions', {
    ownerSub,
    plaidItemId,
    count: transactions.length,
  });

  for (const transaction of transactions) {
    const normalized = normalizeTransaction(transaction);
    logAwsTableAccess('PlaidTransaction', 'listPlaidTransactionByTransaction_id');
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
      logAwsTableAccess('PlaidTransaction', 'update');
      await client.models.PlaidTransaction.update({ id: existingTransaction.id, ...input });
      console.log('[PlaidFlow][Sync] transaction updated', {
        plaidItemId,
        transactionId: normalized.transaction_id,
        name: normalized.name,
        merchantName: normalized.merchant_name,
        amount: normalized.amount,
        date: normalized.date,
      });
    } else {
      logAwsTableAccess('PlaidTransaction', 'create');
      await client.models.PlaidTransaction.create(input);
      console.log('[PlaidFlow][Sync] transaction created', {
        plaidItemId,
        transactionId: normalized.transaction_id,
        name: normalized.name,
        merchantName: normalized.merchant_name,
        amount: normalized.amount,
        date: normalized.date,
      });
    }
  }
}

async function removeTransactions(
  client: DataClient,
  removedTransactions: TransactionsSyncResponse['removed']
) {
  console.log('[PlaidFlow][Sync] removing transactions', {
    count: removedTransactions.length,
  });

  for (const transaction of removedTransactions) {
    logAwsTableAccess('PlaidTransaction', 'listPlaidTransactionByTransaction_id');
    const existing = await client.models.PlaidTransaction.listPlaidTransactionByTransaction_id({
      transaction_id: transaction.transaction_id,
    });
    const existingTransaction = existing.data?.[0];

    if (existingTransaction?.id) {
      logAwsTableAccess('PlaidTransaction', 'update');
      await client.models.PlaidTransaction.update({
        id: existingTransaction.id,
        removed: true,
        synced_at: new Date().toISOString(),
      });
      console.log('[PlaidFlow][Sync] transaction marked removed', {
        transactionId: transaction.transaction_id,
      });
    }
  }
}
