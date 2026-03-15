const rawBaseUrl = process.env.EXPO_PUBLIC_PLAID_API_BASE_URL ?? "";
const defaultBearerToken = process.env.EXPO_PUBLIC_PLAID_BEARER_TOKEN ?? "";

function getBaseUrl() {
  return rawBaseUrl.replace(/\/+$/, "");
}

function buildHeaders(bearerToken?: string) {
  const token = (bearerToken ?? defaultBearerToken).trim();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(response: Response) {
  const text = await response.text();
  if (!text) return `${response.status} ${response.statusText}`;
  return `${response.status} ${response.statusText}: ${text}`;
}

async function request<T>(path: string, init: RequestInit, bearerToken?: string): Promise<T> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error("Missing EXPO_PUBLIC_PLAID_API_BASE_URL");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(bearerToken),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export type PlaidInstitution = {
  institution_id: string;
  name?: string;
};

export type PlaidAccountMetadata = {
  id: string;
  mask?: string;
  name?: string;
  subtype?: string;
  type?: string;
};

export type PlaidLinkMetadata = {
  institution: PlaidInstitution;
  link_session_id?: string;
  accounts?: PlaidAccountMetadata[];
};

export async function createPlaidLinkToken(bearerToken?: string) {
  return request<{ link_token: string }>(
    "/v1/tokens",
    {
      method: "GET",
    },
    bearerToken
  );
}

export async function exchangePlaidPublicToken(
  publicToken: string,
  metadata: PlaidLinkMetadata,
  bearerToken?: string
) {
  return request<void>(
    "/v1/tokens",
    {
      method: "POST",
      body: JSON.stringify({
        public_token: publicToken,
        metadata,
      }),
    },
    bearerToken
  );
}
