import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { createPlaidLinkToken } from '../functions/create-plaid-link-token/resource';
import { exchangePlaidPublicToken } from '../functions/exchange-plaid-public-token/resource';
import { syncPlaidTransactions } from '../functions/sync-plaid-transactions/resource';

const schema = a.schema({
  PlaidLinkTokenResponse: a.customType({
    link_token: a.string().required(),
    expiration: a.datetime(),
    request_id: a.string(),
  }),

  PlaidSyncResult: a.customType({
    plaid_item_id: a.string(),
    item_count: a.integer(),
    account_count: a.integer(),
    added_count: a.integer(),
    modified_count: a.integer(),
    removed_count: a.integer(),
    next_cursor: a.string(),
  }),

  TransactionCounterparty: a.customType({
    confidence_level: a.string(),
    entity_id: a.string(),
    logo_url: a.url(),
    name: a.string().required(),
    phone_number: a.phone(),
    type: a.string().required(),
    website: a.string(),
  }),

  TransactionLocation: a.customType({
    address: a.string(),
    city: a.string(),
    country: a.string(),
    lat: a.float(),
    lon: a.float(),
    postal_code: a.string(),
    region: a.string(),
    store_number: a.string(),
  }),

  TransactionPaymentMeta: a.customType({
    by_order_of: a.string(),
    payee: a.string(),
    payer: a.string(),
    payment_method: a.string(),
    payment_processor: a.string(),
    ppd_id: a.string(),
    reason: a.string(),
    reference_number: a.string(),
  }),

  PersonalFinanceCategory: a.customType({
    confidence_level: a.string(),
    detailed: a.string().required(),
    primary: a.string().required(),
  }),

  UserProfile: a
    .model({
      email: a.email().required(),
      firstName: a.string(),
      ageRange: a.string(),
      monthlyIncome: a.float(),
      monthlyExpenses: a.float(),
      riskTolerance: a.string(),
      totalAssets: a.float(),
      totalLiabilities: a.float(),
      totalNetWorth: a.float(),
      onboardingComplete: a.boolean().required(),
    })
    .authorization((allow) => [allow.owner()]),

  PlaidItem: a
    .model({
      ownerSub: a.string().required(),
      item_id: a.string().required(),
      institution_id: a.string(),
      institution_name: a.string(),
      link_session_id: a.string(),
      status: a.string(),
      transactions_cursor: a.string(),
      last_successful_sync_at: a.datetime(),
      needs_reauth: a.boolean(),
      sandbox_persona: a.string(),
    })
    .secondaryIndexes((index) => [
      index('item_id'),
      index('ownerSub').queryField('listPlaidItemByOwnerSub'),
    ])
    .authorization((allow) => [allow.owner()]),

  PlaidAccount: a
    .model({
      ownerSub: a.string().required(),
      plaid_item_id: a.string().required(),
      account_id: a.string().required(),
      name: a.string(),
      official_name: a.string(),
      mask: a.string(),
      type: a.string(),
      subtype: a.string(),
      current_balance: a.float(),
      available_balance: a.float(),
      iso_currency_code: a.string(),
      unofficial_currency_code: a.string(),
      last_synced_at: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index('account_id'),
      index('plaid_item_id'),
    ])
    .authorization((allow) => [allow.owner()]),

  PlaidAccessToken: a
    .model({
      ownerSub: a.string().required(),
      item_id: a.string().required(),
      access_token: a.string().required(),
      environment: a.string().required(),
    })
    .secondaryIndexes((index) => [
      index('item_id'),
      index('ownerSub'),
    ])
    .authorization((allow) => [allow.owner().to(['create'])]),

  PlaidTransaction: a
    .model({
      ownerSub: a.string(),
      account_id: a.string().required(),
      account_owner: a.string(),
      amount: a.float().required(),
      authorized_date: a.date(),
      authorized_datetime: a.datetime(),
      category: a.string().array(),
      category_id: a.string(),
      check_number: a.string(),
      counterparties: a.ref('TransactionCounterparty').array(),
      date: a.date().required(),
      datetime: a.datetime(),
      iso_currency_code: a.string(),
      location: a.ref('TransactionLocation'),
      logo_url: a.url(),
      merchant_entity_id: a.string(),
      merchant_name: a.string(),
      name: a.string().required(),
      payment_channel: a.string().required(),
      payment_meta: a.ref('TransactionPaymentMeta'),
      pending: a.boolean().required(),
      pending_transaction_id: a.string(),
      personal_finance_category: a.ref('PersonalFinanceCategory'),
      personal_finance_category_icon_url: a.url(),
      transaction_code: a.string(),
      transaction_id: a.string().required(),
      transaction_type: a.string(),
      unofficial_currency_code: a.string(),
      website: a.string(),
      plaid_item_id: a.string(),
      plaid_account_mask: a.string(),
      synced_at: a.datetime(),
      removed: a.boolean(),
    })
    .secondaryIndexes((index) => [
      index('transaction_id'),
      index('date'),
      index('merchant_name'),
      index('plaid_item_id'),
    ])
    .authorization((allow) => [allow.owner()]),

  createPlaidLinkToken: a
    .query()
    .returns(a.ref('PlaidLinkTokenResponse'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(createPlaidLinkToken)),

  exchangePlaidPublicToken: a
    .mutation()
    .arguments({
      public_token: a.string().required(),
      institution_id: a.string(),
      institution_name: a.string(),
      link_session_id: a.string(),
      sandbox_persona: a.string(),
    })
    .returns(a.ref('PlaidSyncResult'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(exchangePlaidPublicToken)),

  syncPlaidTransactions: a
    .mutation()
    .arguments({
      plaid_item_id: a.string(),
    })
    .returns(a.ref('PlaidSyncResult'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(syncPlaidTransactions)),
}).authorization((allow) => [
  allow.resource(exchangePlaidPublicToken).to(['query', 'mutate']),
  allow.resource(syncPlaidTransactions).to(['query', 'mutate']),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
