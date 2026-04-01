"use client";

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { authClient } from "@/lib/auth/auth-client";
import { SUPPORTED_AUTH_PROVIDER_DETAILS, SUPPORTED_AUTH_PROVIDERS } from "@/lib/auth/auth-providers";

export function SocialAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      {SUPPORTED_AUTH_PROVIDERS.map((provider) => {
        const Icon = SUPPORTED_AUTH_PROVIDER_DETAILS[provider].Icon;

        return (
          <BetterAuthActionButton
            variant="outline"
            key={provider}
            action={() => {
              if (provider === "steam") {
                return authClient.signIn.steam({
                  callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/`,
                  newUserCallbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/`,
                  errorCallbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
                });
              }

              return authClient.signIn.social({
                provider,
                callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/`,
                newUserCallbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/`,
                errorCallbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
              });
            }}
          >
            <Icon />
            {SUPPORTED_AUTH_PROVIDER_DETAILS[provider].name}
          </BetterAuthActionButton>
        );
      })}
    </div>
  );
}
