import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

const fallbackAuth = {
  user: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {}
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? fallbackAuth;
}
