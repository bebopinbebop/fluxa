import { defineFunction, secret } from '@aws-amplify/backend';

export const createPlaidLinkToken = defineFunction({
  name: 'create-plaid-link-token',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 20,
  environment: {
    PLAID_CLIENT_ID: secret('PLAID_CLIENT_ID'),
    PLAID_SECRET: secret('PLAID_SECRET'),
    PLAID_ENV: secret('PLAID_ENV'),
    PLAID_CLIENT_NAME: 'Fluxa',
    PLAID_PRODUCTS: 'transactions',
    PLAID_COUNTRY_CODES: 'US',
    PLAID_LANGUAGE: 'en',
    PLAID_IOS_REDIRECT_URI: secret('PLAID_IOS_REDIRECT_URI'),
    PLAID_ANDROID_PACKAGE_NAME: 'com.apexcloudindustries.fluxa',
  },
});
