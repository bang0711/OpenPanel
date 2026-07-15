import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same-origin: /api/auth/* is proxied to the backend by proxy.ts. No baseURL
  // needed, so nothing about the API origin is baked into the client bundle.
  plugins: [adminClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
