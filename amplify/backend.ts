import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { createPlaidLinkToken } from './functions/create-plaid-link-token/resource';
import { exchangePlaidPublicToken } from './functions/exchange-plaid-public-token/resource';
import { syncPlaidTransactions } from './functions/sync-plaid-transactions/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  createPlaidLinkToken,
  exchangePlaidPublicToken,
  syncPlaidTransactions,
});
