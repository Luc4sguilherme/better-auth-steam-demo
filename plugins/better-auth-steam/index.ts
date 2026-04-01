import { APIError, createAuthEndpoint, getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { type BetterAuthPlugin, type User } from "better-auth";
import type { BetterAuthClientPlugin } from "better-auth";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";

const STEAM_BASE_URL = "https://api.steampowered.com/";
const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_STATE_PREFIX = "steam-auth-state";
const STEAM_STATE_COOKIE = "steam_auth_state";
const STATE_EXPIRY_MS = 10 * 60 * 1000;

const IDENTIFIER_REGEX = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

const openIdQuerySchema = z.object({
  "openid.ns": z
    .string()
    .meta({ description: "The namespace of the OpenID request" })
    .optional()
    .default("http://specs.openid.net/auth/2.0"),
  "openid.mode": z.string().meta({ description: "The mode of the OpenID request" }).optional().default("id_res"),
  "openid.op_endpoint": z
    .string()
    .meta({ description: "The OP endpoint of the OpenID request" })
    .optional()
    .default("https://steamcommunity.com/openid/login"),
  "openid.claimed_id": z.string().meta({ description: "The claimed ID of the OpenID request" }).optional(),
  "openid.identity": z.string().meta({ description: "The identity of the OpenID request" }).optional(),
  "openid.return_to": z.string().meta({ description: "The return_to URL of the OpenID request" }).optional(),
  "openid.response_nonce": z.string().meta({ description: "The response nonce of the OpenID request" }).optional(),
  "openid.assoc_handle": z.string().meta({ description: "The assoc handle of the OpenID request" }).optional(),
  "openid.signed": z.string().meta({ description: "The signed fields of the OpenID request" }).optional(),
  "openid.sig": z.string().meta({ description: "The signature of the OpenID request" }).optional(),
});

export interface SteamPlayer {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

interface SteamProfileResponse {
  response: {
    players: SteamPlayer[];
  };
}

export interface SteamAuthPluginOptions {
  /** Your Steam API key. Register at https://steamcommunity.com/dev/apikey */
  apiKey: string;
  /** Custom callback URL for the OpenID return_to parameter */
  callbackURL?: string;
  /** Whether to enable account linking. @default false */
  accountLinking?: boolean;
}

function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const steamAuthPlugin = (options: SteamAuthPluginOptions) =>
  ({
    id: "steamAuthPlugin",
    endpoints: {
      signInWithSteam: createAuthEndpoint(
        "/sign-in/steam",
        {
          method: "POST",
          metadata: {
            openapi: {
              description: "Initiate sign-in with Steam via OpenID 2.0",
              responses: {
                "200": {
                  description: "Returns the Steam OpenID redirect URL",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          url: { type: "string", description: "Steam OpenID login URL" },
                          redirect: { type: "boolean", description: "Whether the client should redirect" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          body: z.object({
            callbackURL: z.string().meta({ description: "The URL to redirect to after sign-in" }).optional(),
            errorCallbackURL: z.string().meta({ description: "The URL to redirect to if an error occurs" }).optional(),
            newUserCallbackURL: z
              .string()
              .meta({ description: "The URL to redirect to if the user is new" })
              .optional(),
            disableRedirect: z.boolean().meta({ description: "Whether to disable automatic redirect" }).optional(),
          }),
        },
        async (ctx) => {
          const state = generateRandomState();

          await ctx.context.internalAdapter.createVerificationValue({
            identifier: `${STEAM_STATE_PREFIX}:${state}`,
            value: JSON.stringify({
              callbackURL: ctx.body.callbackURL,
              errorCallbackURL: ctx.body.errorCallbackURL,
              newUserCallbackURL: ctx.body.newUserCallbackURL,
            }),
            expiresAt: new Date(Date.now() + STATE_EXPIRY_MS),
          });

          ctx.setCookie(STEAM_STATE_COOKIE, state, {
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            maxAge: 600,
            path: "/",
          });

          const returnTo = new URL(options.callbackURL || `${ctx.context.baseURL}/steam/callback`);
          returnTo.searchParams.set("state", state);

          const openidParams = new URLSearchParams({
            "openid.ns": "http://specs.openid.net/auth/2.0",
            "openid.mode": "checkid_setup",
            "openid.return_to": returnTo.toString(),
            "openid.realm": ctx.context.baseURL,
            "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
            "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
          });

          return ctx.json({
            url: `${STEAM_OPENID_URL}?${openidParams.toString()}`,
            redirect: !ctx.body.disableRedirect,
          });
        },
      ),

      steamCallback: createAuthEndpoint(
        "/steam/callback",
        {
          method: "GET",
          query: openIdQuerySchema.extend({
            state: z.string().meta({ description: "CSRF state parameter" }),
            linkAccount: z.string().meta({ description: "Flag indicating this is an account-linking flow" }).optional(),
          }),
          metadata: {
            client: false,
            openapi: {
              description:
                "Steam OpenID callback endpoint. Validates the OpenID response and creates/links the user session.",
              responses: {
                "302": {
                  description: "Redirects to the appropriate callback URL after authentication",
                },
              },
            },
          },
        },
        async (ctx) => {
          const state = ctx.query.state;
          const cookieState = ctx.getCookie(STEAM_STATE_COOKIE);

          if (!state || !cookieState || state !== cookieState) {
            throw ctx.redirect(`${ctx.context.baseURL}?error=csrf_validation_failed`);
          }

          ctx.setCookie(STEAM_STATE_COOKIE, "", {
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            maxAge: 0,
            path: "/",
          });

          const verification = await ctx.context.internalAdapter.findVerificationValue(
            `${STEAM_STATE_PREFIX}:${state}`,
          );

          if (!verification || verification.expiresAt < new Date()) {
            throw ctx.redirect(`${ctx.context.baseURL}?error=state_expired_or_invalid`);
          }

          await ctx.context.internalAdapter.deleteVerificationByIdentifier(`${STEAM_STATE_PREFIX}:${state}`);

          const { callbackURL, errorCallbackURL, newUserCallbackURL } = JSON.parse(verification.value) as {
            callbackURL?: string;
            errorCallbackURL?: string;
            newUserCallbackURL?: string;
          };

          const errorRedirect = errorCallbackURL || ctx.context.baseURL;

          const openidParams: Record<string, string> = {};
          const openIdKeys = Object.keys(openIdQuerySchema.shape) as (keyof z.infer<typeof openIdQuerySchema>)[];
          for (const key of openIdKeys) {
            const value = ctx.query[key];
            if (value != null) {
              openidParams[key] = value;
            }
          }
          openidParams["openid.mode"] = "check_authentication";

          const verifyRes = await fetch(STEAM_OPENID_URL, {
            method: "POST",
            body: new URLSearchParams(openidParams),
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          const verifyText = await verifyRes.text();

          if (!verifyText.includes("is_valid:true")) {
            throw ctx.redirect(`${errorRedirect}?error=steam_openid_validation_failed`);
          }

          const claimedId = ctx.query["openid.claimed_id"];
          const identifierMatch = claimedId ? IDENTIFIER_REGEX.exec(claimedId) : null;

          if (!identifierMatch) {
            throw ctx.redirect(`${errorRedirect}?error=invalid_steamid`);
          }

          const steamid = identifierMatch[1];

          const profileUrl = new URL("ISteamUser/GetPlayerSummaries/v0002/", STEAM_BASE_URL);
          profileUrl.searchParams.set("key", options.apiKey);
          profileUrl.searchParams.set("steamids", steamid);

          const profileRes = await fetch(profileUrl.toString());

          if (!profileRes.ok) {
            throw ctx.redirect(`${errorRedirect}?error=steam_profile_fetch_failed`);
          }

          const profileData: SteamProfileResponse = await profileRes.json();
          const player = profileData.response?.players?.[0];

          if (!player) {
            throw ctx.redirect(`${errorRedirect}?error=steam_profile_fetch_failed`);
          }

          if (ctx.query.linkAccount === "true") {
            const session = await getSessionFromCtx(ctx);

            if (!session) {
              throw ctx.redirect(`${errorRedirect}?error=session_required_for_linking`);
            }

            const existingAccount = await ctx.context.internalAdapter.findAccount(steamid);

            if (existingAccount) {
              if (existingAccount.userId !== session.user.id) {
                throw ctx.redirect(`${errorRedirect}?error=account_already_linked_to_different_user`);
              }

              throw ctx.redirect(callbackURL || ctx.context.baseURL);
            }

            const newAccount = await ctx.context.internalAdapter.createAccount({
              userId: session.user.id,
              providerId: "steam",
              accountId: steamid,
            });

            if (!newAccount) {
              throw ctx.redirect(`${errorRedirect}?error=account_creation_failed`);
            }

            throw ctx.redirect(callbackURL || ctx.context.baseURL);
          }

          let user: User | null = null;
          let isNewUser = false;

          const existingAccount = await ctx.context.internalAdapter.findAccountByProviderId(steamid, "steam");

          if (!existingAccount) {
            isNewUser = true;
            const result = await ctx.context.internalAdapter.createOAuthUser(
              {
                name: player.personaname || "Steam User",
                email: `${steamid}@steam.local`, // steam does not provide email
                emailVerified: false,
                image: player.avatarfull || "",
              },
              {
                accountId: steamid,
                providerId: "steam",
              },
            );
            user = result.user;
          } else {
            user = await ctx.context.internalAdapter.findUserById(existingAccount.userId);
          }

          if (!user) {
            throw ctx.redirect(`${errorRedirect}?error=user_creation_failed`);
          }

          const session = await ctx.context.internalAdapter.createSession(user.id, undefined);

          await setSessionCookie(ctx, { session, user });

          const redirectURL = isNewUser
            ? newUserCallbackURL || callbackURL || ctx.context.baseURL
            : callbackURL || ctx.context.baseURL;

          throw ctx.redirect(redirectURL);
        },
      ),

      linkAccountWithSteam: createAuthEndpoint(
        "/steam/link",
        {
          method: "POST",
          use: [sessionMiddleware],
          metadata: {
            openapi: {
              description: "Link a Steam account to the currently authenticated user",
              responses: {
                "200": {
                  description: "Returns the Steam OpenID redirect URL for account linking",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          url: { type: "string", description: "Steam OpenID login URL" },
                          redirect: { type: "boolean", description: "Whether the client should redirect" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          body: z.object({
            callbackURL: z.string().meta({ description: "The URL to redirect to after linking" }).optional(),
            errorCallbackURL: z.string().meta({ description: "The URL to redirect to if an error occurs" }).optional(),
            disableRedirect: z.boolean().meta({ description: "Whether to disable automatic redirect" }).optional(),
          }),
        },
        async (ctx) => {
          if (options.accountLinking !== true) {
            throw new APIError("BAD_REQUEST", {
              message: "Account linking is disabled",
            });
          }

          const state = generateRandomState();

          await ctx.context.internalAdapter.createVerificationValue({
            identifier: `${STEAM_STATE_PREFIX}:${state}`,
            value: JSON.stringify({
              callbackURL: ctx.body.callbackURL,
              errorCallbackURL: ctx.body.errorCallbackURL,
              linkAccount: true,
            }),
            expiresAt: new Date(Date.now() + STATE_EXPIRY_MS),
          });

          ctx.setCookie(STEAM_STATE_COOKIE, state, {
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            maxAge: 600,
            path: "/",
          });

          const returnTo = new URL(options.callbackURL || `${ctx.context.baseURL}/steam/callback`);
          returnTo.searchParams.set("state", state);
          returnTo.searchParams.set("linkAccount", "true");

          const apiOrigin = new URL(ctx.context.baseURL).origin;

          const openidParams = new URLSearchParams({
            "openid.ns": "http://specs.openid.net/auth/2.0",
            "openid.mode": "checkid_setup",
            "openid.return_to": returnTo.toString(),
            "openid.realm": apiOrigin,
            "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
            "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
          });

          return ctx.json({
            url: `${STEAM_OPENID_URL}?${openidParams.toString()}`,
            redirect: !ctx.body.disableRedirect,
          });
        },
      ),

      unlinkSteamAccount: createAuthEndpoint(
        "/steam/unlink",
        {
          method: "POST",
          use: [sessionMiddleware],
          metadata: {
            openapi: {
              description: "Unlink a Steam account from the currently authenticated user",
              responses: {
                "200": {
                  description: "Steam account unlinked successfully",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          success: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          body: z.object({
            accountId: z.string().meta({ description: "The Steam account ID (steamid64) to unlink" }).optional(),
          }),
        },
        async (ctx) => {
          if (options.accountLinking !== true) {
            throw new APIError("BAD_REQUEST", {
              message: "Account linking is disabled",
            });
          }

          const session = ctx.context.session;
          const userId = session.user.id;

          const accounts = await ctx.context.internalAdapter.findAccounts(userId);
          const steamAccount = accounts.find(
            (a) => a.providerId === "steam" && (ctx.body.accountId ? a.accountId === ctx.body.accountId : true),
          );

          if (!steamAccount) {
            throw new APIError("NOT_FOUND", {
              message: "No linked Steam account found",
            });
          }

          if (accounts.length <= 1) {
            throw new APIError("BAD_REQUEST", {
              message: "Cannot unlink the only authentication method",
            });
          }

          await ctx.context.internalAdapter.deleteAccount(steamAccount.id);

          return ctx.json({ success: true });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;

export const steamAuthClient = () => {
  return {
    id: "steam",
    $InferServerPlugin: {} as ReturnType<typeof steamAuthPlugin>,
    atomListeners: [
      {
        matcher(path) {
          return path === "/steam/callback" || path === "/steam/link" || path === "/steam/unlink";
        },
        signal: "$sessionSignal",
      },
    ],
    getActions: ($fetch) => {
      return {
        /**
         * Sign in with Steam
         * Redirects the user to Steam's authentication page
         */
        signInWithSteam: async () => {
          window.location.href = "/auth/sign-in/steam";
          return { data: null };
        },

        /**
         * Link a Steam account to the current user
         * Redirects the user to Steam's authentication page
         */
        linkSteamAccount: async ({ callbackURL }: any) => {
          const response = await $fetch("/steam/link", {
            method: "POST",
            body: {
              callbackURL,
            },
          });
          return response;
        },

        /**
         * Unlink a Steam account from the current user
         */
        unlinkSteamAccount: async () => {
          const response = await $fetch("/steam/unlink", {
            method: "POST",
          });
          return response;
        },
      };
    },
  } satisfies BetterAuthClientPlugin;
};
