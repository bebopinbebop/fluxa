import { createContext, useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getCurrentUser, signIn as amplifySignIn, signOut as amplifySignOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useRouter, useSegments } from 'expo-router';

type AuthCtx = {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx | null>(null);

function mapSignInError(error: unknown) {
  const e = error as { name?: string; message?: string };
  const name = e?.name ?? '';
  const message = e?.message ?? '';

  if (name === 'NotAuthorizedException') return 'Incorrect email or password.';
  if (name === 'UserNotConfirmedException') return 'User is not confirmed. Check your email for the confirmation code.';
  if (name === 'UserNotFoundException') return 'No user found for this email.';
  if (name === 'NetworkError') return 'Network error while signing in. Check your connection and try again.';
  if (message) return message;
  return 'An unknown error has occurred while signing in.';
}

function getErrorDetails(error: unknown) {
  const e = error as {
    name?: string;
    message?: string;
    code?: string;
    recoverySuggestion?: string;
    underlyingError?: { name?: string; message?: string; code?: string };
  };

  return {
    name: e?.name ?? null,
    code: e?.code ?? null,
    message: e?.message ?? null,
    recoverySuggestion: e?.recoverySuggestion ?? null,
    underlyingName: e?.underlyingError?.name ?? null,
    underlyingCode: e?.underlyingError?.code ?? null,
    underlyingMessage: e?.underlyingError?.message ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  async function refreshUser() {
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshUser();
    const sub = Hub.listen('auth', () => refreshUser());
    return () => sub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Protected route logic (matches Expo Router docs)
  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) router.replace('/(auth)/sign-in');
    if (user && inAuthGroup) router.replace('/(tabs)');
  }, [user, loading, segments, router]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        const username = email.trim().toLowerCase();
        try {
          let result;
          try {
            result = await amplifySignIn({ username, password });
          } catch (error) {
            const details = getErrorDetails(error);
            const shouldRetryWithPasswordFlow =
              details.name === 'Unknown' ||
              details.message?.toLowerCase().includes('unknown error') === true;

            if (!shouldRetryWithPasswordFlow) throw error;

            console.warn('[Auth] SRP signIn failed; retrying with USER_PASSWORD_AUTH', details);
            result = await amplifySignIn({
              username,
              password,
              options: { authFlowType: 'USER_PASSWORD_AUTH' },
            });
          }

          if (!result.isSignedIn) {
            const step = result.nextStep?.signInStep;
            if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
              throw new Error('This user must set a new password first. Use "Forgot password" to set a new password, then sign in again.');
            }
            throw new Error(`Sign-in requires an additional step: ${step ?? 'UNKNOWN_STEP'}.`);
          }
          await refreshUser();
        } catch (error) {
          console.error('[Auth] signIn failed', getErrorDetails(error));
          throw new Error(mapSignInError(error));
        }
      },
      signUp: async (email) => {
        // Placeholder: wire this to `signUp` from `aws-amplify/auth`.
        // Keeping it layout-only for now.
        console.log('TODO: connect Amplify signUp. Email:', email);
      },
      signOut: async () => {
        await amplifySignOut();
        setUser(null);
        router.replace('/(auth)/sign-in');
      }
    }),
    [user, loading, router]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
