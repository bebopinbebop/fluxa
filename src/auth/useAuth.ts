import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

const fallbackAuth = {
  user: null,
  profile: null,
  transactions: [],
  loading: false,
  transactionsLoading: false,
  signIn: async () => {},
  signUp: async () => {},
  confirmSignUp: async () => {},
  signOut: async () => {},
  cancelOnboarding: async () => {},
  refreshProfile: async () => null,
  refreshTransactions: async () => [],
  completeOnboarding: async () => null,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? fallbackAuth;
}
