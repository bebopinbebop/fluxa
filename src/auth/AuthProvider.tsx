import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  autoSignIn,
  confirmSignUp as amplifyConfirmSignUp,
  getCurrentUser,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useRouter, useSegments } from 'expo-router';
import {
  createMyProfile,
  deleteMyProfile,
  getMyProfile,
  syncMyProfileFinancials,
  type CreateMyProfileInput,
  type UserProfile,
} from '../lib/profile';
import { ensureMyTransactionsFromCloud } from '../lib/transactionStore';
import type { Transaction } from '../types/transaction';

type SignUpInput = {
  email: string;
  password: string;
};

type ConfirmSignUpInput = {
  email: string;
  confirmationCode: string;
};

type AuthUser = Awaited<ReturnType<typeof getCurrentUser>>;

type AuthCtx = {
  user: AuthUser | null;
  profile: UserProfile | null;
  transactions: Transaction[];
  loading: boolean;
  transactionsLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  cancelOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  refreshTransactions: (email?: string | null) => Promise<Transaction[]>;
  completeOnboarding: (input: CreateMyProfileInput) => Promise<UserProfile | null>;
};

export const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const router = useRouter();
  const segments = useSegments();

  const refreshProfile = useCallback(async () => {
    try {
      const nextProfile = await getMyProfile();
      const syncedProfile = await syncMyProfileFinancials(nextProfile);
      setProfile(syncedProfile);
      return syncedProfile;
    } catch (error) {
      console.error('[Auth] profile load failed', error);
      setProfile(null);
      return null;
    }
  }, []);

  const refreshTransactions = useCallback(async (email?: string | null) => {
    setTransactionsLoading(true);

    try {
      const nextTransactions = await ensureMyTransactionsFromCloud(email);
      setTransactions(nextTransactions);
      return nextTransactions;
    } catch (error) {
      console.error('[Auth] transaction load failed', error);
      setTransactions([]);
      return [];
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const refreshAuthState = useCallback(async () => {
    setLoading(true);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      const nextProfile = await refreshProfile();

      if (nextProfile?.email) {
        await refreshTransactions(nextProfile.email);
      } else {
        setTransactions([]);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile, refreshTransactions]);

  useEffect(() => {
    void refreshAuthState();

    const unsubscribe = Hub.listen('auth', () => {
      void refreshAuthState();
    });

    return () => {
      unsubscribe();
    };
  }, [refreshAuthState]);

  useEffect(() => {
    if (loading) return;

    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    const inOnboardingGroup = group === '(onboarding)';
    const inTabsGroup = group === '(tabs)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (user && !profile && !inOnboardingGroup) {
      router.replace('/(onboarding)');
      return;
    }

    if (user && profile && !inTabsGroup) {
      router.replace('/(tabs)');
    }
  }, [loading, profile, router, segments, user]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      profile,
      transactions,
      loading,
      transactionsLoading,

      signIn: async (email: string, password: string) => {
        const username = email.trim().toLowerCase();

        const result = await amplifySignIn({ username, password });

        if (!result.isSignedIn) {
          const step = result.nextStep?.signInStep;
          throw new Error(`Extra step required: ${step ?? 'UNKNOWN_STEP'}`);
        }

        await refreshAuthState();
      },

      signUp: async ({ email, password }: SignUpInput) => {
        const username = email.trim().toLowerCase();

        await amplifySignUp({
          username,
          password,
          options: {
            userAttributes: {
              email: username,
            },
            autoSignIn: true,
          },
        });
      },

      confirmSignUp: async ({ email, confirmationCode }: ConfirmSignUpInput) => {
        const result = await amplifyConfirmSignUp({
          username: email.trim().toLowerCase(),
          confirmationCode: confirmationCode.trim(),
        });

        if (result.nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
          const signInResult = await autoSignIn();
          const step = signInResult.nextStep?.signInStep;

          if (step && step !== 'DONE') {
            throw new Error(`Extra sign-in step required: ${step}`);
          }
        }

        await refreshAuthState();
      },

      signOut: async () => {
        try {
          await amplifySignOut();
        } finally {
          setUser(null);
          setProfile(null);
          setTransactions([]);
        }
      },

      cancelOnboarding: async () => {
        try {
          await deleteMyProfile();
        } catch (error) {
          console.error('[Auth] onboarding cancel cleanup failed', error);
        }

        try {
          await amplifySignOut();
        } finally {
          setUser(null);
          setProfile(null);
          setTransactions([]);
        }
      },

      refreshProfile,
      refreshTransactions,

      completeOnboarding: async (input: CreateMyProfileInput) => {
        const nextProfile = await createMyProfile(input);
        const syncedProfile = await syncMyProfileFinancials(nextProfile);
        setProfile(syncedProfile);
        await refreshTransactions(syncedProfile?.email ?? input.email);
        return syncedProfile;
      },
    }),
    [loading, profile, refreshProfile, refreshTransactions, router, transactions, transactionsLoading, user]
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
