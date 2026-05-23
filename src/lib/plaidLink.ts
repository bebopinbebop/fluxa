import {
  createPlaidLinkToken,
  exchangePlaidPublicToken,
  type PlaidLinkMetadata,
} from './plaidApi';

type OpenPlaidLinkOptions = {
  sandboxPersona?: string;
  onStatus?: (status: string | null) => void;
  onExit?: () => void;
};

export async function openPlaidLink({ sandboxPersona, onStatus, onExit }: OpenPlaidLinkOptions = {}) {
  onStatus?.('Creating Plaid Link session...');
  const result = await createPlaidLinkToken();
  const plaid = await import('react-native-plaid-link-sdk');

  await plaid.destroy?.();
  plaid.create({ token: result.link_token });
  onStatus?.('Opening Plaid Link...');

  return new Promise<'connected' | 'exited'>((resolve, reject) => {
    plaid.open({
      onSuccess: async (success) => {
        try {
          onStatus?.('Saving connected account...');
          await exchangePlaidPublicToken(success.publicToken, normalizePlaidMetadata(success.metadata, sandboxPersona));
          onStatus?.('Account connected and transactions synced.');
          resolve('connected');
        } catch (error) {
          reject(error);
        }
      },
      onExit: (exit) => {
        onExit?.();

        if (exit?.error?.errorMessage) {
          reject(new Error(exit.error.errorMessage));
          return;
        }

        onStatus?.(null);
        resolve('exited');
      },
    });
  });
}

function normalizePlaidMetadata(metadata: any, sandboxPersona?: string): PlaidLinkMetadata {
  return {
    institution: {
      institution_id: metadata?.institution?.id ?? metadata?.institution?.institution_id ?? '',
      name: metadata?.institution?.name,
    },
    link_session_id: metadata?.linkSessionId,
    accounts: metadata?.accounts ?? [],
    sandbox_persona: sandboxPersona,
  };
}
