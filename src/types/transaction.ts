export type PlaidConfidenceLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type TransactionCounterparty = {
  confidence_level: PlaidConfidenceLevel | null;
  entity_id: string | null;
  logo_url: string | null;
  name: string;
  phone_number: string | null;
  type: 'merchant' | 'financial_institution' | 'payment_app' | 'marketplace' | 'other';
  website: string | null;
};

export type TransactionLocation = {
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  postal_code: string | null;
  region: string | null;
  store_number: string | null;
};

export type TransactionPaymentMeta = {
  by_order_of: string | null;
  payee: string | null;
  payer: string | null;
  payment_method: string | null;
  payment_processor: string | null;
  ppd_id: string | null;
  reason: string | null;
  reference_number: string | null;
};

export type PersonalFinanceCategory = {
  confidence_level: PlaidConfidenceLevel | null;
  detailed: string;
  primary: string;
};

export type PaymentChannel = 'online' | 'in store' | 'other';

export type Transaction = {
  account_id: string;
  account_owner: string | null;
  amount: number;
  authorized_date: string | null;
  authorized_datetime: string | null;
  category: string[];
  category_id: string | null;
  check_number: string | null;
  counterparties: TransactionCounterparty[];
  date: string;
  datetime: string | null;
  iso_currency_code: string | null;
  location: TransactionLocation;
  logo_url: string | null;
  merchant_entity_id: string | null;
  merchant_name: string | null;
  name: string;
  payment_channel: PaymentChannel;
  payment_meta: TransactionPaymentMeta;
  pending: boolean;
  pending_transaction_id: string | null;
  personal_finance_category: PersonalFinanceCategory;
  personal_finance_category_icon_url: string | null;
  transaction_code: string | null;
  transaction_id: string;
  transaction_type: string | null;
  unofficial_currency_code: string | null;
  website: string | null;
};
