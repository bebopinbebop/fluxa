import { defineFunction, secret } from '@aws-amplify/backend';

export const syncPlaidTransactions = defineFunction({
  name: 'sync-plaid-transactions',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 90,
  environment: {
    PLAID_CLIENT_ID: secret('PLAID_CLIENT_ID'),
    PLAID_SECRET: secret('PLAID_SECRET'),
    PLAID_ENV: secret('PLAID_ENV'),
  },
});
