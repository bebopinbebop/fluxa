import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getSeedTransactionsForEmail } from '../data/seedTransactions';
import type { Transaction } from '../types/transaction';
import { sortTransactions } from './transactions';

const client = generateClient<Schema>();

type PlaidTransactionRecord = Schema['PlaidTransaction']['type'];

export async function listMyTransactionsFromCloud() {
  const data = await listMyTransactionRecords();
  return sortTransactions(
    dedupeTransactions(
      (data ?? [])
        .filter((record: PlaidTransactionRecord) => !record.removed)
        .map(transactionRecordToAppTransaction)
    )
  );
}

export async function ensureMyTransactionsFromCloud(email?: string | null) {
  const existingRecords = await listMyTransactionRecords();
  const hasPlaidItems = await hasConnectedPlaidItems();
  const existingTransactions = dedupeTransactions(
    existingRecords
      .filter((record: PlaidTransactionRecord) => !record.removed)
      .map(transactionRecordToAppTransaction)
  );
  const seedTransactions = getSeedTransactionsForEmail(email);

  if (
    !hasPlaidItems &&
    seedTransactions.length > 0 &&
    shouldResetSeedTransactions(existingRecords.length, existingTransactions, seedTransactions)
  ) {
    await replaceMyTransactionsWithSeed(existingRecords, seedTransactions);
    return listMyTransactionsFromCloud();
  }

  return sortTransactions(existingTransactions);
}

async function hasConnectedPlaidItems() {
  const { data, errors } = await client.models.PlaidItem.list();

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return Boolean(data?.length);
}

export async function saveMyTransactionsToCloud(transactions: Transaction[]) {
  // Future Plaid integration: call this from the Plaid sync flow after
  // normalizing /transactions/sync results into the app Transaction type.
  const existingIds = new Set((await listMyTransactionsFromCloud()).map((transaction) => transaction.transaction_id));

  for (const transaction of transactions) {
    if (existingIds.has(transaction.transaction_id)) {
      continue;
    }

    const { errors } = await client.models.PlaidTransaction.create({
      ...transaction,
      synced_at: new Date().toISOString(),
    });

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    existingIds.add(transaction.transaction_id);
  }
}

function dedupeTransactions(transactions: Transaction[]) {
  const byTransactionId = new Map<string, Transaction>();

  for (const transaction of transactions) {
    byTransactionId.set(transaction.transaction_id, transaction);
  }

  return Array.from(byTransactionId.values());
}

async function listMyTransactionRecords() {
  const { data, errors } = await client.models.PlaidTransaction.list();

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data ?? [];
}

async function replaceMyTransactionsWithSeed(records: PlaidTransactionRecord[], seedTransactions: Transaction[]) {
  for (const record of records) {
    const { errors } = await client.models.PlaidTransaction.delete({ id: record.id });

    if (errors?.length) {
      throw new Error(errors[0].message);
    }
  }

  await saveMyTransactionsToCloud(seedTransactions);
}

function shouldResetSeedTransactions(
  existingRecordCount: number,
  existingTransactions: Transaction[],
  seedTransactions: Transaction[]
) {
  if (existingRecordCount !== existingTransactions.length) {
    return true;
  }

  if (existingTransactions.length !== seedTransactions.length) {
    return true;
  }

  const existingSignature = buildSeedSignature(existingTransactions);
  const seedSignature = buildSeedSignature(seedTransactions);

  return existingSignature !== seedSignature;
}

function buildSeedSignature(transactions: Transaction[]) {
  return transactions
    .map((transaction) => `${transaction.transaction_id}:${transaction.amount}:${transaction.date}`)
    .sort()
    .join('|');
}

function transactionRecordToAppTransaction(record: PlaidTransactionRecord): Transaction {
  return {
    account_id: record.account_id,
    account_owner: record.account_owner ?? null,
    amount: record.amount,
    authorized_date: record.authorized_date ?? null,
    authorized_datetime: record.authorized_datetime ?? null,
    category: record.category?.filter((category: unknown): category is string => Boolean(category)) ?? [],
    category_id: record.category_id ?? null,
    check_number: record.check_number ?? null,
    counterparties:
      record.counterparties?.map((counterparty: any) => ({
        confidence_level: counterparty?.confidence_level as Transaction['counterparties'][number]['confidence_level'],
        entity_id: counterparty?.entity_id ?? null,
        logo_url: counterparty?.logo_url ?? null,
        name: counterparty?.name ?? 'Unknown',
        phone_number: counterparty?.phone_number ?? null,
        type: (counterparty?.type as Transaction['counterparties'][number]['type']) ?? 'other',
        website: counterparty?.website ?? null,
      })) ?? [],
    date: record.date,
    datetime: record.datetime ?? null,
    iso_currency_code: record.iso_currency_code ?? null,
    location: {
      address: record.location?.address ?? null,
      city: record.location?.city ?? null,
      country: record.location?.country ?? null,
      lat: record.location?.lat ?? null,
      lon: record.location?.lon ?? null,
      postal_code: record.location?.postal_code ?? null,
      region: record.location?.region ?? null,
      store_number: record.location?.store_number ?? null,
    },
    logo_url: record.logo_url ?? null,
    merchant_entity_id: record.merchant_entity_id ?? null,
    merchant_name: record.merchant_name ?? null,
    name: record.name,
    payment_channel: (record.payment_channel as Transaction['payment_channel']) ?? 'other',
    payment_meta: {
      by_order_of: record.payment_meta?.by_order_of ?? null,
      payee: record.payment_meta?.payee ?? null,
      payer: record.payment_meta?.payer ?? null,
      payment_method: record.payment_meta?.payment_method ?? null,
      payment_processor: record.payment_meta?.payment_processor ?? null,
      ppd_id: record.payment_meta?.ppd_id ?? null,
      reason: record.payment_meta?.reason ?? null,
      reference_number: record.payment_meta?.reference_number ?? null,
    },
    pending: record.pending,
    pending_transaction_id: record.pending_transaction_id ?? null,
    personal_finance_category: {
      confidence_level: record.personal_finance_category?.confidence_level as Transaction['personal_finance_category']['confidence_level'],
      detailed: record.personal_finance_category?.detailed ?? 'UNKNOWN',
      primary: record.personal_finance_category?.primary ?? 'OTHER',
    },
    personal_finance_category_icon_url: record.personal_finance_category_icon_url ?? null,
    transaction_code: record.transaction_code ?? null,
    transaction_id: record.transaction_id,
    transaction_type: record.transaction_type ?? null,
    unofficial_currency_code: record.unofficial_currency_code ?? null,
    website: record.website ?? null,
  };
}
