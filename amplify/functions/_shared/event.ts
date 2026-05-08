type AppSyncIdentity = {
  sub?: string;
  username?: string;
  claims?: Record<string, unknown>;
};

export function getSignedInUser(event: { identity?: unknown }) {
  const identity = event.identity as AppSyncIdentity | null | undefined;
  const sub = identity?.sub ?? stringClaim(identity, 'sub');
  const username = identity?.username ?? stringClaim(identity, 'cognito:username') ?? sub;
  const email = stringClaim(identity, 'email');

  if (!sub || !username) {
    throw new Error('Unable to determine the signed-in user.');
  }

  return { sub, username, email };
}

function stringClaim(identity: AppSyncIdentity | null | undefined, key: string) {
  const value = identity?.claims?.[key];
  return typeof value === 'string' ? value : undefined;
}
