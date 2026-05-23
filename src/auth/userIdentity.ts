import type { getCurrentUser } from 'aws-amplify/auth';

type AuthUser = Awaited<ReturnType<typeof getCurrentUser>>;

export function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

export function getUserEmailUsername(user?: AuthUser | null) {
  return normalizeEmail(user?.signInDetails?.loginId ?? user?.username);
}
