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
  const platform = event.arguments.platform ?? 'unknown';
  const oauthConfig = getOAuthConfig(platform);

  console.log('[PlaidFlow][Lambda:createLinkToken] start', {
    ownerSub: user.sub,
    username: user.username,
    platform,
    products,
    countryCodes,
    language: process.env.PLAID_LANGUAGE ?? 'en',
    plaidEnv: process.env.PLAID_ENV ?? 'sandbox',
    hasRedirectUri: Boolean(oauthConfig.redirect_uri),
    hasAndroidPackageName: Boolean(oauthConfig.android_package_name),
  });

  const response = await plaidRequest<LinkTokenResponse>('/link/token/create', {
    client_name: process.env.PLAID_CLIENT_NAME ?? 'Fluxa',
    country_codes: countryCodes,
    language: process.env.PLAID_LANGUAGE ?? 'en',
    products,
    ...oauthConfig,
    user: {
      client_user_id: user.sub,
    },
  });

  console.log('[PlaidFlow][Lambda:createLinkToken] success', {
    ownerSub: user.sub,
    requestId: response.request_id,
    expiration: response.expiration,
    hasLinkToken: Boolean(response.link_token),
  });

  return response;
};

function getOAuthConfig(platform: string | null | undefined) {
  const normalizedPlatform = String(platform ?? '').toLowerCase();

  if (normalizedPlatform === 'ios') {
    const redirectUri = process.env.PLAID_IOS_REDIRECT_URI;

    if (!redirectUri) {
      console.log('[PlaidFlow][Lambda:createLinkToken] iOS redirect URI is not configured. OAuth institutions may warn or fail to return to the app.');
      return {};
    }

    return { redirect_uri: redirectUri };
  }

  if (normalizedPlatform === 'android') {
    const androidPackageName = process.env.PLAID_ANDROID_PACKAGE_NAME;

    if (!androidPackageName) {
      console.log('[PlaidFlow][Lambda:createLinkToken] Android package name is not configured. OAuth institutions may warn or fail.');
      return {};
    }

    return { android_package_name: androidPackageName };
  }

  console.log('[PlaidFlow][Lambda:createLinkToken] unknown platform; no OAuth redirect config included', {
    platform,
  });

  return {};
}
