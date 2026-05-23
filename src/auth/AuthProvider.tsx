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
  type UpdateMyProfileInput,
  type UserProfile,
  updateMyProfile,
} from '../lib/profile';
import { getMyFinancialSnapshot, type UserFinancialSnapshot } from '../lib/financialSnapshot';
import { hasConnectedPlaidItems } from '../lib/plaidConnection';
import { ensureMyTransactionsFromCloud } from '../lib/transactionStore';
import type { Transaction } from '../types/transaction';
import { normalizeEmail } from './userIdentity';

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
  financialSnapshot: UserFinancialSnapshot | null;
  transactions: Transaction[];
  hasConnectedBank: boolean;
  loading: boolean;
  transactionsLoading: boolean;
  isRefreshingData: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  cancelOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  refreshFinancialSnapshot: () => Promise<UserFinancialSnapshot | null>;
  refreshBankConnection: () => Promise<boolean>;
  refreshTransactions: (email?: string | null) => Promise<Transaction[]>;
  refreshAppData: () => Promise<void>;
  completeOnboarding: (input: CreateMyProfileInput) => Promise<UserProfile | null>;
  updateProfile: (input: UpdateMyProfileInput) => Promise<UserProfile | null>;
};

export const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [financialSnapshot, setFinancialSnapshot] = useState<UserFinancialSnapshot | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasConnectedBank, setHasConnectedBank] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

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

  const refreshFinancialSnapshot = useCallback(async () => {
    try {
      const nextSnapshot = await getMyFinancialSnapshot();
      setFinancialSnapshot(nextSnapshot);
      return nextSnapshot;
    } catch (error) {
      console.error('[Auth] financial snapshot load failed', error);
      setFinancialSnapshot(null);
      return null;
    }
  }, []);

  const refreshBankConnection = useCallback(async () => {
    try {
      const connected = await hasConnectedPlaidItems();
      setHasConnectedBank(connected);
      return connected;
    } catch (error) {
      console.error('[Auth] bank connection load failed', error);
      setHasConnectedBank(false);
      return false;
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
        const [connectedByItem, nextTransactions, nextSnapshot] = await Promise.all([
          refreshBankConnection(),
          refreshTransactions(nextProfile.email),
          refreshFinancialSnapshot(),
        ]);
        setHasConnectedBank(hasBankBackedData(connectedByItem, nextTransactions, nextSnapshot));
      } else {
        setHasConnectedBank(false);
        setTransactions([]);
        setFinancialSnapshot(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setHasConnectedBank(false);
      setFinancialSnapshot(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [refreshBankConnection, refreshFinancialSnapshot, refreshProfile, refreshTransactions]);

  const refreshAppData = useCallback(async () => {
    setIsRefreshingData(true);

    try {
      const nextProfile = await refreshProfile();

      if (nextProfile?.email) {
        const [connectedByItem, nextTransactions, nextSnapshot] = await Promise.all([
          refreshBankConnection(),
          refreshTransactions(nextProfile.email),
          refreshFinancialSnapshot(),
        ]);
        setHasConnectedBank(hasBankBackedData(connectedByItem, nextTransactions, nextSnapshot));
      } else {
        setHasConnectedBank(false);
        setTransactions([]);
        setFinancialSnapshot(null);
      }
    } finally {
      setIsRefreshingData(false);
    }
  }, [refreshBankConnection, refreshFinancialSnapshot, refreshProfile, refreshTransactions]);

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

    if (user && profile && !inTabsGroup && !inOnboardingGroup) {
      router.replace('/(tabs)');
    }
  }, [loading, profile, router, segments, user]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      profile,
      financialSnapshot,
      transactions,
      hasConnectedBank,
      loading,
      transactionsLoading,
      isRefreshingData,

      signIn: async (email: string, password: string) => {
        const username = normalizeEmail(email);

        const result = await amplifySignIn({ username, password });

        if (!result.isSignedIn) {
          const step = result.nextStep?.signInStep;
          throw new Error(`Extra step required: ${step ?? 'UNKNOWN_STEP'}`);
        }

        await refreshAuthState();
      },

      signUp: async ({ email, password }: SignUpInput) => {
        const username = normalizeEmail(email);

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
          username: normalizeEmail(email),
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
          setHasConnectedBank(false);
          setFinancialSnapshot(null);
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
          setHasConnectedBank(false);
          setFinancialSnapshot(null);
          setTransactions([]);
        }
      },

      refreshProfile,
      refreshFinancialSnapshot,
      refreshBankConnection,
      refreshTransactions,
      refreshAppData,

      completeOnboarding: async (input: CreateMyProfileInput) => {
        const nextProfile = await createMyProfile(input);
        const syncedProfile = await syncMyProfileFinancials(nextProfile);
        setProfile(syncedProfile);
        const [connectedByItem, nextTransactions, nextSnapshot] = await Promise.all([
          refreshBankConnection(),
          refreshTransactions(syncedProfile?.email ?? input.email),
          refreshFinancialSnapshot(),
        ]);
        setHasConnectedBank(hasBankBackedData(connectedByItem, nextTransactions, nextSnapshot));
        return syncedProfile;
      },

      updateProfile: async (input: UpdateMyProfileInput) => {
        const nextProfile = await updateMyProfile(input);
        setProfile(nextProfile);
        return nextProfile;
      },
    }),
    [
      financialSnapshot,
      hasConnectedBank,
      isRefreshingData,
      loading,
      profile,
      refreshAppData,
      refreshBankConnection,
      refreshFinancialSnapshot,
      refreshProfile,
      refreshTransactions,
      router,
      transactions,
      transactionsLoading,
      user,
    ]
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

function hasBankBackedData(
  connectedByItem: boolean,
  transactions: Transaction[],
  snapshot: UserFinancialSnapshot | null
) {
  return (
    connectedByItem ||
    transactions.length > 0 ||
    (snapshot?.connectedAccountCount ?? 0) > 0 ||
    (snapshot?.connectedInstitutionCount ?? 0) > 0 ||
    (snapshot?.transactionCount ?? 0) > 0
  );
}
