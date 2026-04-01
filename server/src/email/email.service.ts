import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  ChangeEmailVerificationDto,
  DeleteAccountVerificationDto,
  EmailVerificationDto,
  PasswordResetDto,
  WelcomeEmailDto,
} from './dto/email.dto';
import {
  deleteAccountTemplate,
  emailVerificationTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from './templates';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private resend: Resend;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.defaultFrom =
      this.configService.getOrThrow<string>('EMAIL_FROM') ||
      'Acme <onboarding@resend.dev>';
  }

  async sendEmail(options: SendEmailOptions) {
    const { to, subject, html, text, from, replyTo } = options;

    const { data, error } = await this.resend.emails.send({
      from: from || this.defaultFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(text && { text }),
      ...(replyTo && { replyTo }),
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  }

  async sendEmailVerification({ user, url }: EmailVerificationDto) {
    const template = emailVerificationTemplate(user.name, url);
    return this.sendEmail({
      to: user.email,
      ...template,
    });
  }

  async sendChangeEmailVerification({
    user,
    newEmail,
    url,
  }: ChangeEmailVerificationDto) {
    const template = emailVerificationTemplate(user.name, url);
    return this.sendEmail({
      to: newEmail,
      ...template,
    });
  }

  async sendPasswordReset({ user, url }: PasswordResetDto) {
    const template = passwordResetTemplate(user.name, url);
    return this.sendEmail({
      to: user.email,
      ...template,
    });
  }

  async sendDeleteAccountVerification({
    user,
    url,
  }: DeleteAccountVerificationDto) {
    const template = deleteAccountTemplate(user.name, url);
    return this.sendEmail({
      to: user.email,
      ...template,
    });
  }

  async sendWelcome({ user }: WelcomeEmailDto) {
    const template = welcomeTemplate(user.name);
    return this.sendEmail({
      to: user.email,
      ...template,
    });
  }
}
