import type { PlaidAccount, PlaidTransaction } from './plaid';

const emptyLocation = {
  address: null,
  city: null,
  country: null,
  lat: null,
  lon: null,
  postal_code: null,
  region: null,
  store_number: null,
};

const emptyPaymentMeta = {
  by_order_of: null,
  payee: null,
  payer: null,
  payment_method: null,
  payment_processor: null,
  ppd_id: null,
  reason: null,
  reference_number: null,
};

const emptyPersonalFinanceCategory = {
  confidence_level: null,
  detailed: 'UNKNOWN',
  primary: 'OTHER',
};

export function normalizeAccount(account: PlaidAccount) {
  return {
    account_id: account.account_id,
    available_balance: account.balances?.available ?? null,
    current_balance: account.balances?.current ?? null,
    iso_currency_code: account.balances?.iso_currency_code ?? null,
    mask: account.mask ?? null,
    name: account.name ?? 'Plaid account',
    official_name: account.official_name ?? null,
    subtype: account.subtype ?? null,
    type: account.type ?? null,
    unofficial_currency_code: account.balances?.unofficial_currency_code ?? null,
  };
}

export function normalizeTransaction(transaction: PlaidTransaction) {
  const location = (transaction.location ?? {}) as Record<string, unknown>;
  const paymentMeta = (transaction.payment_meta ?? {}) as Record<string, unknown>;
  const personalFinanceCategory = (transaction.personal_finance_category ?? {}) as Record<string, unknown>;

  return {
    account_id: transaction.account_id,
    account_owner: transaction.account_owner ?? null,
    amount: transaction.amount,
    authorized_date: transaction.authorized_date ?? null,
    authorized_datetime: transaction.authorized_datetime ?? null,
    category: transaction.category ?? [],
    category_id: transaction.category_id ?? null,
    check_number: transaction.check_number ?? null,
    counterparties:
      transaction.counterparties?.map((counterparty) => ({
        confidence_level: stringOrNull(counterparty.confidence_level),
        entity_id: stringOrNull(counterparty.entity_id),
        logo_url: stringOrNull(counterparty.logo_url),
        name: stringOrNull(counterparty.name) ?? 'Unknown',
        phone_number: stringOrNull(counterparty.phone_number),
        type: stringOrNull(counterparty.type) ?? 'other',
        website: stringOrNull(counterparty.website),
      })) ?? [],
    date: transaction.date,
    datetime: transaction.datetime ?? null,
    iso_currency_code: transaction.iso_currency_code ?? null,
    location: {
      ...emptyLocation,
      address: stringOrNull(location.address),
      city: stringOrNull(location.city),
      country: stringOrNull(location.country),
      lat: numberOrNull(location.lat),
      lon: numberOrNull(location.lon),
      postal_code: stringOrNull(location.postal_code),
      region: stringOrNull(location.region),
      store_number: stringOrNull(location.store_number),
    },
    logo_url: transaction.logo_url ?? null,
    merchant_entity_id: transaction.merchant_entity_id ?? null,
    merchant_name: transaction.merchant_name ?? null,
    name: transaction.name,
    payment_channel: transaction.payment_channel,
    payment_meta: {
      ...emptyPaymentMeta,
      by_order_of: stringOrNull(paymentMeta.by_order_of),
      payee: stringOrNull(paymentMeta.payee),
      payer: stringOrNull(paymentMeta.payer),
      payment_method: stringOrNull(paymentMeta.payment_method),
      payment_processor: stringOrNull(paymentMeta.payment_processor),
      ppd_id: stringOrNull(paymentMeta.ppd_id),
      reason: stringOrNull(paymentMeta.reason),
      reference_number: stringOrNull(paymentMeta.reference_number),
    },
    pending: transaction.pending,
    pending_transaction_id: transaction.pending_transaction_id ?? null,
    personal_finance_category: {
      ...emptyPersonalFinanceCategory,
      confidence_level: stringOrNull(personalFinanceCategory.confidence_level),
      detailed: stringOrNull(personalFinanceCategory.detailed) ?? 'UNKNOWN',
      primary: stringOrNull(personalFinanceCategory.primary) ?? 'OTHER',
    },
    personal_finance_category_icon_url: transaction.personal_finance_category_icon_url ?? null,
    transaction_code: transaction.transaction_code ?? null,
    transaction_id: transaction.transaction_id,
    transaction_type: transaction.transaction_type ?? null,
    unofficial_currency_code: transaction.unofficial_currency_code ?? null,
    website: transaction.website ?? null,
  };
}

function stringOrNull(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
