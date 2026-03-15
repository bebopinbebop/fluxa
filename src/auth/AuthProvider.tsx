import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  confirmSignUp as amplifyConfirmSignUp,
  getCurrentUser,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useRouter, useSegments } from 'expo-router';
import { createMyProfile, getMyProfile, type CreateMyProfileInput, type UserProfile } from '../lib/profile';

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
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  completeOnboarding: (input: CreateMyProfileInput) => Promise<UserProfile | null>;
};

export const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  const refreshProfile = useCallback(async () => {
    try {
      const nextProfile = await getMyProfile();
      setProfile(nextProfile);
      return nextProfile;
    } catch (error) {
      console.error('[Auth] profile load failed', error);
      setProfile(null);
      return null;
    }
  }, []);

  const refreshAuthState = useCallback(async () => {
    setLoading(true);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      await refreshProfile();
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

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
      loading,

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
          },
        });
      },

      confirmSignUp: async ({ email, confirmationCode }: ConfirmSignUpInput) => {
        await amplifyConfirmSignUp({
          username: email.trim().toLowerCase(),
          confirmationCode: confirmationCode.trim(),
        });
      },

      signOut: async () => {
        try {
          await amplifySignOut();
        } finally {
          setUser(null);
          setProfile(null);
          router.replace('/(auth)/sign-in');
        }
      },

      refreshProfile,

      completeOnboarding: async (input: CreateMyProfileInput) => {
        const nextProfile = await createMyProfile(input);
        setProfile(nextProfile);
        return nextProfile;
      },
    }),
    [loading, profile, refreshProfile, router, user]
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
