import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { createBetterAuth } from './lib/betterAuth';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    EmailModule,
    BetterAuthModule.forRootAsync({
      inject: [PrismaService, ConfigService, EmailService],
      useFactory: (
        prisma: PrismaService,
        configService: ConfigService,
        emailService: EmailService,
      ) => ({
        auth: createBetterAuth(prisma, configService, emailService),
        disableGlobalAuthGuard: true,
      }),
    }),
  ],
})
export class AuthModule {}
