import { Amplify } from "aws-amplify";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import outputs from "../../amplify_outputs.json";

let configured = false;
let statusLogged = false;

export function configureAmplify() {
  if (configured) return;
  Amplify.configure(outputs);
  configured = true;

  const region = outputs?.auth?.aws_region ?? "unknown";
  const userPoolId = outputs?.auth?.user_pool_id ?? "unknown";
  const dataApi = outputs?.data?.url ?? "unknown";
  console.log("[Amplify] Configured", { region, userPoolId, dataApi });
}

export async function logAmplifyStatus() {
  if (statusLogged) return;
  statusLogged = true;

  try {
    const session = await fetchAuthSession();
    console.log("[Amplify] Auth session reachable", {
      hasTokens: Boolean(session.tokens),
      hasCredentials: Boolean(session.credentials),
      identityId: session.identityId ?? null,
    });
  } catch (error) {
    console.error("[Amplify] Auth session check failed", error);
  }

  try {
    const currentUser = await getCurrentUser();
    console.log("[Amplify] Current user", {
      userId: currentUser.userId,
      username: currentUser.username,
    });
  } catch {
    console.log("[Amplify] No signed-in user (expected before login).");
  }
}
