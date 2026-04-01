import { adminClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/plugins";
import { createAuthClient } from "better-auth/react";
import { accessControl, admin, user } from "@/components/auth/permissions";
import { steamAuthClient } from "better-auth-steam";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SERVER,
  basePath: "/auth",
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = "/auth/2fa";
      },
    }),
    adminClient({
      ac: accessControl,
      roles: {
        admin,
        user,
      },
    }),
    steamAuthClient(),
  ],
});

export const { signIn, signOut, signUp, useSession } = authClient;
