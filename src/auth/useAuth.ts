import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

const fallbackAuth = {
  user: null,
  profile: null,
  financialSnapshot: null,
  transactions: [],
  hasConnectedBank: false,
  loading: false,
  transactionsLoading: false,
  isRefreshingData: false,
  signIn: async () => {},
  signUp: async () => {},
  confirmSignUp: async () => {},
  signOut: async () => {},
  cancelOnboarding: async () => {},
  refreshProfile: async () => null,
  refreshFinancialSnapshot: async () => null,
  refreshBankConnection: async () => false,
  refreshTransactions: async () => [],
  refreshAppData: async () => {},
  completeOnboarding: async () => null,
  updateProfile: async () => null,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? fallbackAuth;
}
