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
        await amplifySignIn({ username: email, password });
        await refreshUser();
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
