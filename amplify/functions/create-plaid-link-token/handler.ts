import type { Schema } from '../../data/resource';
import { getSignedInUser } from '../_shared/event';
import { plaidRequest } from '../_shared/plaid';

type LinkTokenResponse = {
  link_token: string;
  expiration: string;
  request_id: string;
};

export const handler: Schema['createPlaidLinkToken']['functionHandler'] = async (event) => {
  const user = getSignedInUser(event);
  const products = String(process.env.PLAID_PRODUCTS ?? 'transactions').split(',').map((product: string) => product.trim());
  const countryCodes = String(process.env.PLAID_COUNTRY_CODES ?? 'US').split(',').map((country: string) => country.trim());

  return plaidRequest<LinkTokenResponse>('/link/token/create', {
    client_name: process.env.PLAID_CLIENT_NAME ?? 'Fluxa',
    country_codes: countryCodes,
    language: process.env.PLAID_LANGUAGE ?? 'en',
    products,
    user: {
      client_user_id: user.sub,
    },
  });
};
