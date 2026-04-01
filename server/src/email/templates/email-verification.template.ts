import { actionButton, baseEmailTemplate } from './base.template';

export function emailVerificationTemplate(name: string, url: string) {
  return {
    subject: 'Verify your email address',
    html: baseEmailTemplate(`
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Hello ${name},</p>
      <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
      ${actionButton(url, 'Verify Email')}
      <p>If you didn't create an account, please ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
    `),
    text: `Hello ${name},\n\nThank you for signing up! Please verify your email address by clicking this link: ${url}\n\nIf you didn't create an account, please ignore this email.\n\nThis link will expire in 24 hours.\n\nBest regards,\nYour App Team`,
  };
}
