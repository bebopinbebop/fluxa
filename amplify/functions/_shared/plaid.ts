const PLAID_BASE_URLS = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
} as const;

type PlaidEnv = keyof typeof PLAID_BASE_URLS;

export type PlaidAccount = {
  account_id: string;
  balances?: {
    available?: number | null;
    current?: number | null;
    iso_currency_code?: string | null;
    unofficial_currency_code?: string | null;
  };
  mask?: string | null;
  name?: string | null;
  official_name?: string | null;
  subtype?: string | null;
  type?: string | null;
};

export type PlaidTransaction = {
  account_id: string;
  account_owner?: string | null;
  amount: number;
  authorized_date?: string | null;
  authorized_datetime?: string | null;
  category?: string[] | null;
  category_id?: string | null;
  check_number?: string | null;
  counterparties?: Array<Record<string, unknown>> | null;
  date: string;
  datetime?: string | null;
  iso_currency_code?: string | null;
  location?: Record<string, unknown> | null;
  logo_url?: string | null;
  merchant_entity_id?: string | null;
  merchant_name?: string | null;
  name: string;
  payment_channel: string;
  payment_meta?: Record<string, unknown> | null;
  pending: boolean;
  pending_transaction_id?: string | null;
  personal_finance_category?: Record<string, unknown> | null;
  personal_finance_category_icon_url?: string | null;
  transaction_code?: string | null;
  transaction_id: string;
  transaction_type?: string | null;
  unofficial_currency_code?: string | null;
  website?: string | null;
};

export type TransactionsSyncResponse = {
  accounts: PlaidAccount[];
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: Array<{ transaction_id: string }>;
  next_cursor: string;
  has_more: boolean;
  request_id?: string;
};

function getPlaidBaseUrl() {
  const env = (process.env.PLAID_ENV ?? 'sandbox').toLowerCase() as PlaidEnv;
  return PLAID_BASE_URLS[env] ?? PLAID_BASE_URLS.sandbox;
}

export async function plaidRequest<T>(path: string, body: Record<string, unknown>) {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;

  if (!clientId || !secret) {
    throw new Error('Plaid secrets are not configured.');
  }

  console.log('[PlaidFlow][PlaidRequest] request start', {
    path,
    plaidEnv: process.env.PLAID_ENV ?? 'sandbox',
    bodyKeys: Object.keys(body).filter((key) => key !== 'access_token' && key !== 'public_token'),
    hasAccessToken: Boolean(body.access_token),
    hasPublicToken: Boolean(body.public_token),
  });

  const response = await fetch(`${getPlaidBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      ...body,
    }),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload?.error_message ?? payload?.error_code ?? `${response.status} ${response.statusText}`;
    console.log('[PlaidFlow][PlaidRequest] request failed', {
      path,
      status: response.status,
      statusText: response.statusText,
      errorCode: payload?.error_code ?? null,
      errorType: payload?.error_type ?? null,
      requestId: payload?.request_id ?? null,
    });
    throw new Error(`Plaid request failed: ${message}`);
  }

  console.log('[PlaidFlow][PlaidRequest] request success', {
    path,
    status: response.status,
    requestId: payload?.request_id ?? null,
  });

  return payload as T;
}
