import { betterAuth } from 'better-auth';
import { admin, twoFactor } from 'better-auth/plugins';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';
import type { PrismaClient } from 'prisma/generated/client';
import { Logger } from '@nestjs/common';
import { steamAuthPlugin } from 'better-auth-steam';

export function createBetterAuth(
  prisma: PrismaClient,
  configService: ConfigService,
  emailService: EmailService,
) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    baseURL: configService.getOrThrow('BETTER_AUTH_URL'),
    basePath: '/auth',
    secret: configService.getOrThrow('BETTER_AUTH_SECRET'),
    trustedOrigins: [configService.getOrThrow('BETTER_TRUSTED_ORIGINS')],
    user: {
      changeEmail: {
        enabled: true,
        updateEmailWithoutVerification: false,
        sendChangeEmailConfirmation: async ({ user, url, newEmail }) => {
          await emailService.sendChangeEmailVerification({
            user,
            newEmail,
            url,
          });
        },
      },
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: async ({ user, url }) => {
          await emailService.sendDeleteAccountVerification({ user, url });
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await emailService.sendPasswordReset({ user, url });
      },
    },
    plugins: [
      twoFactor(),
      admin(),
      steamAuthPlugin({
        apiKey: configService.getOrThrow('STEAM_API_KEY'),
        accountLinking: true,
        redirectURL: configService.getOrThrow('BETTER_TRUSTED_ORIGINS'),
      }),
    ],
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await emailService.sendEmailVerification({ user, url });
      },
    },
    logger: {
      log: (level, message, ...args) => {
        const logger = new Logger();

        switch (level) {
          case `error`:
            logger.error(message, ...args, 'AuthService');
            break;
          case `debug`:
            logger.debug(message, ...args, 'AuthService');
            break;
          case `info`:
            logger.log(message, ...args, 'AuthService');
            break;
          case `warn`:
            logger.warn(message, ...args, 'AuthService');
            break;
        }
      },
    },
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
