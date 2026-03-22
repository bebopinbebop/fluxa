import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

const fallbackAuth = {
  user: null,
  profile: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  confirmSignUp: async () => {},
  signOut: async () => {},
  cancelOnboarding: async () => {},
  refreshProfile: async () => null,
  completeOnboarding: async () => null,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? fallbackAuth;
}
